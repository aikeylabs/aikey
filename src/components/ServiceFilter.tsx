import React, { useState, useEffect, useRef } from 'react';
import { ServiceType } from '@/types';
import './ServiceFilter.css';

interface ServiceFilterProps {
  selectedService: ServiceType | 'All';
  onServiceChange: (service: ServiceType | 'All') => void;
}

const SERVICES: Array<ServiceType | 'All'> = [
  'All',
  'OpenAI',
  'Anthropic',
  'Azure OpenAI',
  'Groq',
  'Custom',
];

export const ServiceFilter: React.FC<ServiceFilterProps> = ({
  selectedService,
  onServiceChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleServiceSelect = (service: ServiceType | 'All') => {
    onServiceChange(service);
    setIsOpen(false);
  };

  const displayText = selectedService === 'All' ? 'All Services' : selectedService;

  return (
    <div className="service-filter" ref={dropdownRef}>
      <button
        className="service-filter-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="service-name">{displayText}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="service-dropdown">
          <div className="service-dropdown-header">Filter by Service</div>

          <div className="service-list">
            {SERVICES.map((service) => (
              <button
                key={service}
                className={`service-item ${
                  service === selectedService ? 'active' : ''
                }`}
                onClick={() => handleServiceSelect(service)}
              >
                <span className="service-item-name">
                  {service === 'All' ? 'All Services' : service}
                </span>
                {service === selectedService && (
                  <span className="check-mark">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
