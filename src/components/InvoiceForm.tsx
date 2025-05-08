import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { InvoiceData, LogoSettings, ThankYouSettings, PaymentItem, SecondaryLogoSettings } from '../types';
import { FaPlus, FaTrash } from 'react-icons/fa';

// Template interface
interface InvoiceTemplate {
  name: string;
  data: InvoiceData;
}

interface InvoiceFormProps {
  defaultValues: InvoiceData;
  onUpdate: (data: InvoiceData) => void;
  logoSettings: LogoSettings;
  setLogoSettings: (settings: LogoSettings) => void;
  secondaryLogoSettings: SecondaryLogoSettings;
  setSecondaryLogoSettings: (settings: SecondaryLogoSettings) => void;
  thankYouSettings: ThankYouSettings;
  setThankYouSettings: (settings: ThankYouSettings) => void;
  generatePDF: () => void;
  invoiceData?: InvoiceData;
  setInvoiceData?: (data: InvoiceData) => void;
  setLogoFile?: (file: File | null) => void;
  setSecondaryLogoFile?: (file: File | null) => void;
  setThankYouFile?: (file: File | null) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  defaultValues,
  onUpdate,
  logoSettings,
  setLogoSettings,
  secondaryLogoSettings,
  setSecondaryLogoSettings,
  thankYouSettings,
  setThankYouSettings,
  generatePDF,
  invoiceData,
  setInvoiceData,
  setLogoFile,
  setSecondaryLogoFile,
  setThankYouFile,
}) => {
  const { control, watch, setValue, reset } = useForm<InvoiceData>({
    defaultValues,
  });

  // Add a state to track editing payment items
  const [editingPaymentItems, setEditingPaymentItems] = useState<PaymentItem[]>(
    defaultValues.paymentItems && defaultValues.paymentItems.length > 0 
      ? [...defaultValues.paymentItems] 
      : []
  );

  // Calculate total from payment items
  const calculateTotal = () => {
    if (editingPaymentItems.length > 0) {
      return editingPaymentItems.reduce((sum, item) => {
        // Handle both string and number types for amount
        const amount = typeof item.amount === 'string'
          ? parseFloat(item.amount.replace(/[^0-9.]/g, '') || '0')
          : (item.amount || 0);
        return sum + amount;
      }, 0);
    } else {
      // If no custom items, use deposit + balance
      const formValues = watch();
      const depositStr = formValues.depositAmount?.replace(/[^0-9.]/g, '') || '0';
      const balanceStr = formValues.balanceAmount?.replace(/[^0-9.]/g, '') || '0';
      const deposit = parseFloat(depositStr) || 0;
      const balance = parseFloat(balanceStr) || 0;
      return deposit + balance;
    }
  };

  // Track PDF generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // State for template management
  const [templateName, setTemplateName] = useState<string>('');
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  // Load saved templates from localStorage on initial load
  useEffect(() => {
    const savedTemplates = localStorage.getItem('invoiceTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Save the current invoice data as a template
  const saveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Deep copy to ensure we capture all data
    const formData = watch();
    
    const newTemplate: InvoiceTemplate = {
      name: templateName.trim(),
      data: {
        ...formData,
        paymentItems: [...editingPaymentItems]
      }
    };
    
    try {
      // Check for duplicates
      const existingTemplate = templates.find(t => t.name === newTemplate.name);
      if (existingTemplate) {
        if (!confirm(`A template named "${newTemplate.name}" already exists. Do you want to replace it?`)) {
          return;
        }
        // If confirmed, remove the existing template
        const filteredTemplates = templates.filter(t => t.name !== newTemplate.name);
        const updatedTemplates = [...filteredTemplates, newTemplate];
        setTemplates(updatedTemplates);
        localStorage.setItem('invoiceTemplates', JSON.stringify(updatedTemplates));
      } else {
        // Add new template
        const updatedTemplates = [...templates, newTemplate];
        setTemplates(updatedTemplates);
        localStorage.setItem('invoiceTemplates', JSON.stringify(updatedTemplates));
      }
      
      setTemplateName('');
      setShowTemplateModal(false);
      alert(`Template "${newTemplate.name}" saved successfully!`);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('There was an error saving your template. Please try again.');
    }
  };
  
  // Load a saved template
  const loadTemplate = () => {
    if (!selectedTemplate) return;
    
    try {
      const template = templates.find(t => t.name === selectedTemplate);
      if (template) {
        reset(template.data);
        if (template.data.paymentItems && Array.isArray(template.data.paymentItems)) {
          setEditingPaymentItems(template.data.paymentItems);
        }
        if (setInvoiceData) {
          setInvoiceData(template.data);
        }
        onUpdate(template.data);
        setShowTemplateModal(false);
        setTemplateName('');
        alert(`Template "${template.name}" loaded successfully!`);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('There was an error loading your template. Please try again.');
    }
  };
  
  // Delete a saved template
  const deleteTemplate = (name: string) => {
    if (confirm(`Are you sure you want to delete template "${name}"?`)) {
      const updatedTemplates = templates.filter(t => t.name !== name);
      setTemplates(updatedTemplates);
      localStorage.setItem('invoiceTemplates', JSON.stringify(updatedTemplates));
      alert(`Template "${name}" deleted successfully!`);
    }
  };

  // Forward form data to parent
  const formValues = watch();
  useEffect(() => {
    // Create a copy with payment items
    const updatedValues = {...formValues} as InvoiceData;
    updatedValues.paymentItems = editingPaymentItems;
    onUpdate(updatedValues);
  }, [formValues, onUpdate, editingPaymentItems]);

  // Update total amount when payment items change
  useEffect(() => {
    // Format total back to string with commas
    const total = calculateTotal();
    const formattedTotal = total.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    setValue('totalAmount', formattedTotal);
  }, [editingPaymentItems, setValue, formValues.depositAmount, formValues.balanceAmount]);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Use the prop if available, otherwise just update settings
      if (setLogoFile) {
        setLogoFile(e.target.files[0]);
      }
      setLogoSettings({
        ...logoSettings,
        file: e.target.files[0]
      });
    }
  };

  // Handle secondary logo upload
  const handleSecondaryLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (setSecondaryLogoFile) {
        setSecondaryLogoFile(e.target.files[0]);
      }
      setSecondaryLogoSettings({
        ...secondaryLogoSettings,
        file: e.target.files[0]
      });
    }
  };

  // Handle thank you page upload
  const handleThankYouUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (setThankYouFile) {
        setThankYouFile(e.target.files[0]);
      }
      setThankYouSettings({
        ...thankYouSettings,
        file: e.target.files[0],
      });
    }
  };

  // Handle logo size change
  const handleLogoSizeChange = (e: React.ChangeEvent<HTMLInputElement>, property: 'width' | 'height') => {
    const value = parseInt(e.target.value);
    setLogoSettings({
      ...logoSettings,
      [property]: value,
    });
  };

  // Handle logo position change
  const handleLogoPositionChange = (e: React.ChangeEvent<HTMLInputElement>, axis: 'x' | 'y') => {
    const value = parseInt(e.target.value);
    setLogoSettings({
      ...logoSettings,
      position: {
        ...logoSettings.position,
        [axis]: value,
      },
    });
  };

  // Watch all fields and update when they change
  useEffect(() => {
    const subscription = watch((value) => {
      // Make a deep copy and ensure it's a valid InvoiceData object
      const data = {...value} as InvoiceData;
      // Add payment items
      data.paymentItems = editingPaymentItems;
      // Call the update function
      onUpdate(data);
    });
    return () => subscription.unsubscribe();
  }, [watch, onUpdate, editingPaymentItems]);

  // Handle PDF generation with loading state
  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generatePDF();
    } finally {
      setIsGenerating(false);
    }
  };

  // Template Management Modal
  const TemplateModal = React.memo(() => {
    const [localTemplateName, setLocalTemplateName] = useState(templateName);
    useEffect(() => { setLocalTemplateName(templateName); }, [templateName]);
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h2 className="text-xl font-bold mb-4">Save as Template</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            setTemplateName(localTemplateName);
            saveTemplate();
          }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={localTemplateName}
                onChange={(e) => setLocalTemplateName(e.target.value)}
                className="border border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                placeholder="My Custom Template"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black border border-black rounded-md hover:bg-gray-100"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex justify-between items-center mb-6">
        {templates.length > 0 ? (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="border-gray-300 focus:ring-black focus:border-black rounded-md shadow-sm pr-10"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <button
                  type="button"
                  onClick={() => deleteTemplate(selectedTemplate)}
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                  title="Delete template"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={loadTemplate}
              disabled={!selectedTemplate}
              className={`px-3 py-2 ${!selectedTemplate ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm rounded-md`}
            >
              Load
            </button>
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="bg-white text-black border border-black px-4 py-2 rounded-md hover:bg-gray-100 transition ml-4"
            >
              Save as Template
            </button>
          </div>
        ) : (
          <div></div>
        )}
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
          >
            {isGenerating ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {showTemplateModal && <TemplateModal />}

      <Tabs>
        <TabList className="flex border-b mb-4">
          <Tab className="px-4 py-2 font-medium text-gray-600 hover:text-black cursor-pointer">
            Invoice Details
          </Tab>
          <Tab className="px-4 py-2 font-medium text-gray-600 hover:text-black cursor-pointer">
            Logo & Branding
          </Tab>
          <Tab className="px-4 py-2 font-medium text-gray-600 hover:text-black cursor-pointer">
            Thank You Page
          </Tab>
        </TabList>

        <TabPanel>
          {/* Invoice Details Tab */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Basic Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Invoice Number
                    </label>
                    <Controller
                      name="showInvoiceNumber"
                      control={control}
                      defaultValue={true}
                      render={({ field: { onChange, value } }) => (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">Show</span>
                          <div 
                            className={`relative inline-block w-10 h-5 transition-colors duration-200 ease-in-out rounded-full ${value ? 'bg-black' : 'bg-gray-300'}`}
                            onClick={() => onChange(!value)}
                          >
                            <input
                              type="checkbox"
                              className="absolute w-0 h-0 opacity-0"
                              checked={value}
                              onChange={() => {}}
                            />
                            <span className={`absolute left-0.5 top-0.5 w-4 h-4 transition-transform duration-200 ease-in-out transform ${value ? 'translate-x-5' : 'translate-x-0'} bg-white rounded-full`} />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <Controller
                    name="invoiceNumber"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="INV-001"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        disabled={!watch('showInvoiceNumber')}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <Controller
                      name="showDate"
                      control={control}
                      defaultValue={true}
                      render={({ field: { onChange, value } }) => (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">Show</span>
                          <div 
                            className={`relative inline-block w-10 h-5 transition-colors duration-200 ease-in-out rounded-full ${value ? 'bg-black' : 'bg-gray-300'}`}
                            onClick={() => onChange(!value)}
                          >
                            <input
                              type="checkbox"
                              className="absolute w-0 h-0 opacity-0"
                              checked={value}
                              onChange={() => {}}
                            />
                            <span className={`absolute left-0.5 top-0.5 w-4 h-4 transition-transform duration-200 ease-in-out transform ${value ? 'translate-x-5' : 'translate-x-0'} bg-white rounded-full`} />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        disabled={!watch('showDate')}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Customer ID
                    </label>
                    <Controller
                      name="showCustomerId"
                      control={control}
                      defaultValue={true}
                      render={({ field: { onChange, value } }) => (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">Show</span>
                          <div 
                            className={`relative inline-block w-10 h-5 transition-colors duration-200 ease-in-out rounded-full ${value ? 'bg-black' : 'bg-gray-300'}`}
                            onClick={() => onChange(!value)}
                          >
                            <input
                              type="checkbox"
                              className="absolute w-0 h-0 opacity-0"
                              checked={value}
                              onChange={() => {}}
                            />
                            <span className={`absolute left-0.5 top-0.5 w-4 h-4 transition-transform duration-200 ease-in-out transform ${value ? 'translate-x-5' : 'translate-x-0'} bg-white rounded-full`} />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="CUST-001"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        disabled={!watch('showCustomerId')}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Booking
                  </label>
                  <Controller
                    name="supplier"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="SUPPLIER YYYY"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Booking Title
                  </label>
                  <Controller
                    name="supplierBookingTitle"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="SUPPLIER BOOKING YYYY"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Client Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name
                  </label>
                  <Controller
                    name="clientName"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Controller
                    name="clientAddress"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area / ZIP Code
                  </label>
                  <Controller
                    name="clientAreaZipCode"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <Controller
                    name="clientCity"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <Controller
                    name="clientCountry"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Offer Pending Section</h3>
              
              <div className="flex items-center mb-4">
                <Controller
                  name="showOfferPending"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <input
                      {...field}
                      type="checkbox"
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      className="mr-2"
                    />
                  )}
                />
                <span className="text-sm font-medium">Show Offer Pending Section</span>
              </div>
              
              {watch('showOfferPending') && (
                <div className="pl-4 border-l-2 border-gray-300 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deposit Amount (USD)
                    </label>
                    <Controller
                      name="offerDeposit"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="XX,XXX"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <Controller
                      name="offerDueDate"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="DD MM YYYY"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <Controller
                      name="offerPendingTitle"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="OFFER PENDING:"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text
                    </label>
                    <Controller
                      name="offerPendingText"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          placeholder="To confirm your booking, you must pay the full deposit..."
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium mb-4">Payment Items</h3>
                
                <div className="flex items-center space-x-4">
                  <Controller
                    name="showItemsTable"
                    control={control}
                    defaultValue={true}
                    render={({ field: { onChange, value, ...field } }) => (
                      <div className="flex items-center">
                        <input
                          {...field}
                          type="checkbox"
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Show Items Table</span>
                      </div>
                    )}
                  />
                  
                  <Controller
                    name="showOnlyTotal"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <div className="flex items-center">
                        <input
                          {...field}
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            onChange(e.target.checked);
                            // If showing only total, make sure table is visible
                            if (e.target.checked) {
                              setValue('showItemsTable', true);
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Show Only Total</span>
                      </div>
                    )}
                  />
                </div>
              </div>
              
              {editingPaymentItems.length === 0 && !watch('showOnlyTotal') && (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No payment items yet.</p>
                  <button 
                    type="button"
                    onClick={() => 
                      setEditingPaymentItems([
                        { name: 'Item 1', description: 'Description', amount: 0 }
                      ])
                    }
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Add your first item
                  </button>
                </div>
              )}
              
              {!watch('showOnlyTotal') && (
                <>
                  {editingPaymentItems.map((item, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <div className="flex-1 mr-2">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...editingPaymentItems];
                            newItems[index].description = e.target.value;
                            setEditingPaymentItems(newItems);
                          }}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex-1 mr-2">
                        <input
                          type="text"
                          placeholder="Status (e.g. DUE ON MM/DD/YYYY)"
                          value={item.dueDate}
                          onChange={(e) => {
                            const newItems = [...editingPaymentItems];
                            newItems[index].dueDate = e.target.value;
                            setEditingPaymentItems(newItems);
                          }}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="w-24 mr-2">
                        <input
                          type="text"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => {
                            const newItems = [...editingPaymentItems];
                            newItems[index].amount = parseFloat(e.target.value);
                            setEditingPaymentItems(newItems);
                          }}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = [...editingPaymentItems];
                          newItems.splice(index, 1);
                          setEditingPaymentItems(newItems);
                        }}
                        className="text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {editingPaymentItems.length > 0 && !watch('showOnlyTotal') && (
                    <button
                      type="button"
                      onClick={() => 
                        setEditingPaymentItems([
                          ...editingPaymentItems,
                          { name: `Item ${editingPaymentItems.length + 1}`, description: '', amount: 0 }
                        ])
                      }
                      className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <FaPlus className="mr-1" /> Add Item
                    </button>
                  )}
                </>
              )}
              
              <div className="flex justify-end mt-4">
                <div className="w-48">
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Total:</span>
                    <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Payment Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Controller
                    name="descriptionTitle"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="DESCRIPTION NIHI SUMBA BOOKING 25XXXXX"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deposit Payment Due Date
                    </label>
                    <Controller
                      name="depositDueDate"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="DD MM YYYY"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deposit Amount (USD)
                    </label>
                    <Controller
                      name="depositAmount"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="XX,XXX"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balance Payment Due Date
                    </label>
                    <Controller
                      name="balanceDueDate"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="DD MM YYYY"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balance Amount (USD)
                    </label>
                    <Controller
                      name="balanceAmount"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="XX,XXX"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount (USD)
                  </label>
                  <Controller
                    name="totalAmount"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="XX,XXX"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm font-bold"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Payment Instructions</h3>
              
              <div className="mb-4">
                <div className="flex flex-wrap gap-4">
                  <Controller
                    name="showPaymentInstructions"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <div className="flex items-center">
                        <input
                          {...field}
                          type="checkbox"
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Show Payment Instructions</span>
                      </div>
                    )}
                  />
                </div>
              </div>
              
              {watch('showPaymentInstructions') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      name="showAccountHolder"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <div className="flex items-center">
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Show Account Holder</span>
                        </div>
                      )}
                    />
                    
                    <Controller
                      name="showAccountNumber"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <div className="flex items-center">
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Show Account Number</span>
                        </div>
                      )}
                    />
                    
                    <Controller
                      name="showRoutingNumber"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <div className="flex items-center">
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Show Routing Number</span>
                        </div>
                      )}
                    />
                    
                    <Controller
                      name="showSwiftBic"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <div className="flex items-center">
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Show Swift/BIC</span>
                        </div>
                      )}
                    />
                    
                    <Controller
                      name="showBankName"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <div className="flex items-center">
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Show Bank Name</span>
                        </div>
                      )}
                    />
                    
                    <Controller
                      name="showBankAddress"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <div className="flex items-center">
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Show Bank Address</span>
                        </div>
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder
                    </label>
                    <Controller
                      name="accountHolder"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="ACCOUNT HOLDER NAME"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <Controller
                      name="accountNumber"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="XXXX XXXX XXXX XXXX"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Routing Number
                    </label>
                    <Controller
                      name="routingNumber"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="XXXXXXXXX"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Swift/BIC
                    </label>
                    <Controller
                      name="swiftBic"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="XXXXXXXXXX"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <Controller
                      name="bankName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="BANK NAME"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Address
                    </label>
                    <Controller
                      name="bankAddress"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          placeholder="BANK ADDRESS"
                          rows={3}
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note (Optional)
                    </label>
                    <Controller
                      name="paymentNote"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          placeholder="Please process the bank transfer to the bank account listed above..."
                          rows={3}
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Booking Summary</h3>
              
              <div className="flex items-center mb-4">
                <Controller
                  name="showBookingSummary"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <input
                      {...field}
                      type="checkbox"
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      className="mr-2"
                    />
                  )}
                />
                <span className="text-sm font-medium">Show Booking Summary</span>
              </div>
              
              {watch('showBookingSummary') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b pb-4 mb-4">
                    <div className="flex items-center">
                      <Controller
                        name="showBookingId"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <span className="text-sm font-medium">Show Booking ID</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Controller
                        name="showSupplier"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <span className="text-sm font-medium">Show Supplier</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Controller
                        name="showCustomerName"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <span className="text-sm font-medium">Show Customer Name</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Controller
                        name="showPackage"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <span className="text-sm font-medium">Show Package</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Controller
                        name="showAdults"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <span className="text-sm font-medium">Show Adults</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Controller
                        name="showDates"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <span className="text-sm font-medium">Show Dates</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Controller
                        name="showAccommodation"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <span className="text-sm font-medium">Show Accommodation</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Controller
                        name="showInclusions"
                        control={control}
                        render={({ field: { onChange, value, ...field } }) => (
                          <input
                            {...field}
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <span className="text-sm font-medium">Show Inclusions</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Booking ID
                    </label>
                    <Controller
                      name="bookingId"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier
                    </label>
                    <Controller
                      name="supplierName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Full Name
                    </label>
                    <Controller
                      name="customerFullName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package
                    </label>
                    <Controller
                      name="package"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Adults
                    </label>
                    <Controller
                      name="adults"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dates
                    </label>
                    <Controller
                      name="dates"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="MONTH DDth - DDnd, YYYY | X nights"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accommodation
                    </label>
                    <Controller
                      name="accommodation"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inclusions/Additional Notes
                    </label>
                    <Controller
                      name="inclusions"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Booking Description</h3>
              <div className="flex items-center mb-4">
                <Controller
                  name="showBookingDescription"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <input
                      {...field}
                      type="checkbox"
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      className="mr-2"
                    />
                  )}
                />
                <span className="text-sm font-medium">Include Booking Description Page</span>
              </div>
              
              {watch('showBookingDescription') && (
                <div className="pl-4 border-l-2 border-gray-300">
                  <Controller
                    name="bookingDescription"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={10}
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                        placeholder="Enter booking description here..."
                      />
                    )}
                  />
                </div>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Booking Description Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booking Description Title
                  </label>
                  <Controller
                    name="bookingDescriptionTitle"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="BOOKING DESCRIPTION"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booking ID Header
                  </label>
                  <Controller
                    name="bookingIDHeader"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="BOOKING DESCRIPTION"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booking ID Label
                  </label>
                  <Controller
                    name="bookingIDLabel"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Booking ID:"
                        className="border-gray-300 focus:ring-black focus:border-black block w-full rounded-md shadow-sm"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </TabPanel>

        <TabPanel>
          {/* Logo & Branding Tab */}
          <div className="space-y-6">
            <div className="p-4 bg-white border rounded-md shadow-sm">
              <h3 className="text-lg font-medium mb-4">First Page Logo</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo Width (px)
                  </label>
                  <input
                    type="number"
                    value={logoSettings?.width}
                    onChange={(e) => handleLogoSizeChange(e, 'width')}
                    className="w-full border rounded p-2 mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo Height (px)
                  </label>
                  <input
                    type="number"
                    value={logoSettings?.height}
                    onChange={(e) => handleLogoSizeChange(e, 'height')}
                    className="w-full border rounded p-2 mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo Position - Right (px)
                  </label>
                  <input
                    type="number"
                    value={logoSettings?.position?.x}
                    onChange={(e) => handleLogoPositionChange(e, 'x')}
                    className="w-full border rounded p-2 mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo Position - Top (px)
                  </label>
                  <input
                    type="number"
                    value={logoSettings?.position?.y}
                    onChange={(e) => handleLogoPositionChange(e, 'y')}
                    className="w-full border rounded p-2 mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-md shadow-sm mt-6">
              <h3 className="text-lg font-medium mb-4">Secondary Logo (For Pages After First)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Secondary Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSecondaryLogoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Logo Width (px)
                  </label>
                  <input
                    type="number"
                    value={secondaryLogoSettings?.width}
                    onChange={(e) => {
                      setSecondaryLogoSettings({
                        ...secondaryLogoSettings,
                        width: Number(e.target.value)
                      });
                    }}
                    className="w-full border rounded p-2 mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Logo Height (px)
                  </label>
                  <input
                    type="number"
                    value={secondaryLogoSettings?.height}
                    onChange={(e) => {
                      setSecondaryLogoSettings({
                        ...secondaryLogoSettings,
                        height: Number(e.target.value)
                      });
                    }}
                    className="w-full border rounded p-2 mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Logo Position - Right (px)
                  </label>
                  <input
                    type="number"
                    value={secondaryLogoSettings?.position?.x}
                    onChange={(e) => {
                      setSecondaryLogoSettings({
                        ...secondaryLogoSettings,
                        position: {
                          ...secondaryLogoSettings.position,
                          x: Number(e.target.value)
                        }
                      });
                    }}
                    className="w-full border rounded p-2 mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Logo Position - Top (px)
                  </label>
                  <input
                    type="number"
                    value={secondaryLogoSettings?.position?.y}
                    onChange={(e) => {
                      setSecondaryLogoSettings({
                        ...secondaryLogoSettings,
                        position: {
                          ...secondaryLogoSettings.position,
                          y: Number(e.target.value)
                        }
                      });
                    }}
                    className="w-full border rounded p-2 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel>
          {/* Thank You Page Tab */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Thank You Page Image
              <input
                type="file"
                onChange={handleThankYouUpload}
                accept="image/*"
                className="w-full border rounded p-2 mt-1"
              />
            </label>
            
            <p className="text-sm text-gray-500 mt-2">
              Upload a beautiful full-page image for your Thank You Page.
              Recommended size: A4 (2480 x 3508 pixels)
            </p>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default InvoiceForm; 