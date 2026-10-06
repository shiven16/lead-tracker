import React, { useState, useEffect } from 'react';

const SOURCES = [
  { id: 'office_call', label: 'Phone Call' },
  { id: 'website', label: 'Web Form' },
  { id: 'referral', label: 'Referral' }
];

export default function AddJobDrawer({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    source: 'office_call',
    issue: '',
    estimated_value: '',
    stage: 'new',
    urgent: false
  });
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        customer_name: '',
        phone: '',
        source: 'office_call',
        issue: '',
        estimated_value: '',
        stage: 'new',
        urgent: false
      });
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.phone || !formData.issue) return;
    
    setIsSaving(true);
    await onSave({
      ...formData,
      estimated_value: Number(formData.estimated_value) || 0
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div aria-hidden={!isOpen} className={`fixed inset-0 z-50 transition-opacity duration-200 ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div className="absolute inset-0 bg-on-surface/40 transition-opacity" onClick={onClose}></div>
      <div className={`absolute right-0 top-0 bottom-0 w-full sm:w-[440px] bg-surface border-l border-line flex flex-col justify-between transform transition-transform duration-200 shadow-xl pointer-events-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-space-lg border-b border-line flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">New Job Intake</h3>
            <p className="font-body-sm text-body-sm text-secondary">Record incoming service request or field call</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close add job modal" className="w-10 h-10 rounded-[10px] flex items-center justify-center text-secondary hover:text-on-surface hover:bg-frost">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-space-lg flex-1 overflow-y-auto space-y-space-md">
          <div className="space-y-1">
            <label htmlFor="jobCustomerName" className="font-label-md text-label-md text-on-surface">Customer Name / Account</label>
            <input 
              type="text" 
              id="jobCustomerName" 
              placeholder="e.g. Ballard Meat Market" 
              className="w-full h-12 px-3 bg-surface border border-line rounded-[10px] text-body-lg font-body-lg text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container"
              value={formData.customer_name}
              onChange={e => setFormData({...formData, customer_name: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="jobCustomerPhone" className="font-label-md text-label-md text-on-surface">Primary Phone Number</label>
            <input 
              type="tel" 
              id="jobCustomerPhone" 
              placeholder="(206) 555-XXXX" 
              className="w-full h-12 px-3 bg-surface border border-line rounded-[10px] text-body-lg font-body-lg text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <span className="font-label-md text-label-md text-on-surface">Job Source</span>
            <div className="grid grid-cols-3 gap-2">
              {SOURCES.map(src => (
                <button 
                  key={src.id}
                  type="button" 
                  onClick={() => setFormData({...formData, source: src.id})}
                  className={`h-10 rounded-[10px] border border-line font-label-md text-label-md flex items-center justify-center transition-colors ${
                    formData.source === src.id ? 'bg-primary-container text-on-primary' : 'bg-surface text-on-surface'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="jobIssue" className="font-label-md text-label-md text-on-surface">Equipment & Symptom Note</label>
            <textarea 
              id="jobIssue" 
              rows="3" 
              placeholder="e.g. Master-Bilt walk-in freezer holding 44F. Fan spinning, coil frosted solid." 
              className="w-full p-3 bg-surface border border-line rounded-[10px] text-body-lg font-body-lg text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container"
              value={formData.issue}
              onChange={e => setFormData({...formData, issue: e.target.value})}
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div className="space-y-1">
              <label htmlFor="jobValue" className="font-label-md text-label-md text-on-surface">Est. Revenue ($)</label>
              <input 
                type="number" 
                id="jobValue" 
                placeholder="1200" 
                className="w-full h-12 px-3 bg-surface border border-line rounded-[10px] text-body-lg font-body-lg text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container"
                value={formData.estimated_value}
                onChange={e => setFormData({...formData, estimated_value: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="jobStage" className="font-label-md text-label-md text-on-surface">Initial Stage</label>
              <select 
                id="jobStage" 
                className="w-full h-12 px-3 bg-surface border border-line rounded-[10px] text-body-lg font-body-lg text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container"
                value={formData.stage}
                onChange={e => setFormData({...formData, stage: e.target.value})}
              >
                <option value="new">New</option>
                <option value="waiting_on_quote">Waiting on quote</option>
                <option value="waiting_on_yes">Waiting on their yes</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-[10px] bg-frost border border-line">
            <div>
              <span className="font-label-lg text-label-lg text-on-surface block">Emergency Dispatch?</span>
              <span className="font-body-sm text-body-sm text-secondary">Food spoilage risk or complete shutdown</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.urgent}
                onChange={e => setFormData({...formData, urgent: e.target.checked})}
              />
              <div className="w-11 h-6 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-urgent"></div>
            </label>
          </div>
        </div>

        <div className="p-space-lg border-t border-line bg-surface flex items-center gap-space-sm">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 h-12 border border-line text-on-surface font-label-lg text-label-lg rounded-[10px] hover:bg-frost transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 h-12 bg-primary-container hover:bg-[#09636D] text-on-primary font-label-lg text-label-lg rounded-[10px] transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save job'}
          </button>
        </div>
      </div>
    </div>
  );
}
