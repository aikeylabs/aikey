import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SiteAdapterManager, SITE_ADAPTERS } from '../siteAdapter';

describe('SiteAdapterManager', () => {
  let manager: SiteAdapterManager;

  beforeEach(() => {
    manager = new SiteAdapterManager();
    document.body.innerHTML = '';
  });

  describe('findAdapter', () => {
    it('should find adapter for OpenAI domain', () => {
      const adapter = manager.findAdapter('platform.openai.com');
      expect(adapter).toBeDefined();
      expect(adapter?.displayName).toBe('OpenAI Platform');
      expect(adapter?.service).toBe('OpenAI');
    });

    it('should find adapter for Anthropic domain', () => {
      const adapter = manager.findAdapter('console.anthropic.com');
      expect(adapter).toBeDefined();
      expect(adapter?.displayName).toBe('Anthropic Console');
      expect(adapter?.service).toBe('Anthropic');
    });

    it('should find adapter with partial domain match', () => {
      const adapter = manager.findAdapter('https://platform.openai.com/settings');
      expect(adapter).toBeDefined();
      expect(adapter?.service).toBe('OpenAI');
    });

    it('should return null for unknown domain', () => {
      const adapter = manager.findAdapter('unknown-domain.com');
      expect(adapter).toBeNull();
    });
  });

  describe('findInputField', () => {
    it('should find input field by selector', () => {
      const input = document.createElement('input');
      input.name = 'api_key';
      input.type = 'text';
      document.body.appendChild(input);

      // Mock offsetParent to simulate visible element
      Object.defineProperty(input, 'offsetParent', {
        get: () => document.body,
        configurable: true,
      });

      const adapter = SITE_ADAPTERS[0]; // OpenAI adapter
      const found = manager.findInputField(adapter);

      expect(found).toBe(input);
    });

    it('should return null if field is hidden', () => {
      const input = document.createElement('input');
      input.name = 'api_key';
      input.style.display = 'none';
      document.body.appendChild(input);

      const adapter = SITE_ADAPTERS[0];
      const found = manager.findInputField(adapter);

      expect(found).toBeNull();
    });

    it('should return null if field is disabled', () => {
      const input = document.createElement('input');
      input.name = 'api_key';
      input.disabled = true;
      document.body.appendChild(input);

      const adapter = SITE_ADAPTERS[0];
      const found = manager.findInputField(adapter);

      expect(found).toBeNull();
    });

    it('should return null if field is readonly', () => {
      const input = document.createElement('input');
      input.name = 'api_key';
      input.readOnly = true;
      document.body.appendChild(input);

      const adapter = SITE_ADAPTERS[0];
      const found = manager.findInputField(adapter);

      expect(found).toBeNull();
    });

    it('should try multiple selectors in order', () => {
      const input = document.createElement('input');
      input.placeholder = 'Enter your sk- key';
      document.body.appendChild(input);

      // Mock offsetParent to simulate visible element
      Object.defineProperty(input, 'offsetParent', {
        get: () => document.body,
        configurable: true,
      });

      const adapter = SITE_ADAPTERS[0];
      const found = manager.findInputField(adapter);

      expect(found).toBe(input);
    });
  });

  describe('fillField', () => {
    it('should fill input field with value', async () => {
      const input = document.createElement('input');
      input.name = 'api_key';
      document.body.appendChild(input);

      const adapter = SITE_ADAPTERS[0];
      await manager.fillField(adapter, input, 'sk-test-key-123');

      expect(input.value).toBe('sk-test-key-123');
    });

    it('should trigger input and change events', async () => {
      const input = document.createElement('input');
      input.name = 'api_key';
      document.body.appendChild(input);

      const inputHandler = vi.fn();
      const changeHandler = vi.fn();
      input.addEventListener('input', inputHandler);
      input.addEventListener('change', changeHandler);

      const adapter = SITE_ADAPTERS[0];
      await manager.fillField(adapter, input, 'sk-test-key-123');

      expect(inputHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    it('should focus the field before filling', async () => {
      const input = document.createElement('input');
      input.name = 'api_key';
      document.body.appendChild(input);

      const focusSpy = vi.spyOn(input, 'focus');

      const adapter = SITE_ADAPTERS[0];
      await manager.fillField(adapter, input, 'sk-test-key-123');

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should call beforeFill hook if provided', async () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      const beforeFill = vi.fn();
      const adapter = {
        ...SITE_ADAPTERS[0],
        beforeFill,
      };

      await manager.fillField(adapter, input, 'test-value');

      expect(beforeFill).toHaveBeenCalledWith(input);
    });

    it('should call afterFill hook if provided', async () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      const afterFill = vi.fn();
      const adapter = {
        ...SITE_ADAPTERS[0],
        afterFill,
      };

      await manager.fillField(adapter, input, 'test-value');

      expect(afterFill).toHaveBeenCalledWith(input);
    });
  });

  describe('SITE_ADAPTERS', () => {
    it('should have at least 2 adapters configured', () => {
      expect(SITE_ADAPTERS.length).toBeGreaterThanOrEqual(2);
    });

    it('should have valid adapter structure', () => {
      SITE_ADAPTERS.forEach((adapter) => {
        expect(adapter).toHaveProperty('domain');
        expect(adapter).toHaveProperty('displayName');
        expect(adapter).toHaveProperty('service');
        expect(adapter).toHaveProperty('selectors');
        expect(adapter.selectors).toHaveProperty('apiKeyInput');
        expect(Array.isArray(adapter.selectors.apiKeyInput)).toBe(true);
        expect(adapter.selectors.apiKeyInput.length).toBeGreaterThan(0);
      });
    });

    it('should have unique domains', () => {
      const domains = SITE_ADAPTERS.map((a) => a.domain);
      const uniqueDomains = new Set(domains);
      expect(uniqueDomains.size).toBe(domains.length);
    });
  });
});
