// Site adapter system for detecting and filling API key fields

import type { ServiceType } from '@/types';

export interface SiteAdapter {
  domain: string;
  displayName: string;
  service: ServiceType;
  selectors: {
    apiKeyInput: string[];
    submitButton?: string[];
    settingsContainer?: string[];
  };
  beforeFill?: (element: HTMLElement) => void;
  afterFill?: (element: HTMLElement) => void;
  validateField?: (element: HTMLElement) => boolean;
}

export const SITE_ADAPTERS: SiteAdapter[] = [
  {
    domain: 'platform.openai.com',
    displayName: 'OpenAI Platform',
    service: 'OpenAI',
    selectors: {
      apiKeyInput: [
        'input[name="api_key"]',
        'input[placeholder*="sk-"]',
        'input[type="password"][aria-label*="API"]',
        'input[type="text"][placeholder*="API key"]',
      ],
    },
  },
  {
    domain: 'console.anthropic.com',
    displayName: 'Anthropic Console',
    service: 'Anthropic',
    selectors: {
      apiKeyInput: [
        'input[name="api_key"]',
        'input[placeholder*="sk-ant-"]',
        'input[type="password"][aria-label*="API"]',
      ],
    },
  },
];

export class SiteAdapterManager {
  findAdapter(domain: string): SiteAdapter | null {
    return SITE_ADAPTERS.find((adapter) => domain.includes(adapter.domain)) || null;
  }

  findInputField(adapter: SiteAdapter): HTMLInputElement | null {
    for (const selector of adapter.selectors.apiKeyInput) {
      const element = document.querySelector(selector) as HTMLInputElement;
      if (element && this.isValidField(element, adapter)) {
        return element;
      }
    }
    return null;
  }

  private isValidField(element: HTMLInputElement, adapter: SiteAdapter): boolean {
    // Check if element is visible and editable
    if (!element.offsetParent) return false;
    if (element.disabled || element.readOnly) return false;

    // Custom validation if provided
    if (adapter.validateField) {
      return adapter.validateField(element);
    }

    return true;
  }

  async fillField(
    adapter: SiteAdapter,
    element: HTMLInputElement,
    value: string
  ): Promise<void> {
    // Before fill hook
    if (adapter.beforeFill) {
      adapter.beforeFill(element);
    }

    // Focus the field
    element.focus();

    // Set value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      element.value = value;
    }

    // Trigger events to ensure React/Vue/etc. detect the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    // After fill hook
    if (adapter.afterFill) {
      adapter.afterFill(element);
    }
  }
}

export const siteAdapterManager = new SiteAdapterManager();
