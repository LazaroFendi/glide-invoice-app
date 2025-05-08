import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePreview from '../components/InvoicePreview';
import { InvoiceData, LogoSettings, ThankYouSettings, SecondaryLogoSettings } from '../types';
import generatePdfDocument from '../utils/pdfGenerator';
import { FaArrowRight, FaArrowLeft, FaExpand, FaCompress } from 'react-icons/fa';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

export default function Home() {
  // Invoice data state
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: 'INV-25XXX',
    customerId: '',
    date: '',
    supplier: 'SUPPLIER YYYY-XXX',
    clientName: 'CLIENT NAME',
    clientAddress: '123 CLIENT STREET',
    clientAreaZipCode: 'AREA/ZIP',
    clientCity: 'CITY',
    clientCountry: 'COUNTRY',
    showOfferPending: true,
    offerDeposit: 'X,XXX',
    offerDueDate: 'DD MM YYYY',
    offerPendingTitle: 'OFFER PENDING:',
    offerPendingText: 'To confirm your booking, you must pay the full deposit of X,XXX by DD MM YYYY and balance before due date listed below, otherwise the booking will be cancelled. Please find full booking terms and conditions listed in your booking description.',
    supplierBookingTitle: 'SUPPLIER BOOKING YYYY',
    bookingDescriptionTitle: 'BOOKING DESCRIPTION',
    descriptionTitle: 'DESCRIPTION NIHI SUMBA BOOKING 25XXXXX',
    depositDueDate: 'DD MM YYYY',
    depositAmount: 'X,XXX',
    balanceDueDate: 'DD MM YYYY',
    balanceAmount: 'XX,XXX',
    totalAmount: 'XX,XXX',
    paymentItems: [],
    showPaymentInstructions: true,
    showAccountHolder: true,
    showAccountNumber: true,
    showRoutingNumber: true,
    showSwiftBic: true,
    showBankName: true,
    showBankAddress: true,
    accountHolder: 'ACCOUNT HOLDER NAME',
    accountNumber: 'XXXXXXXXXXXX',
    routingNumber: 'XXXXXXXXX',
    swiftBic: 'XXXXXXXXX',
    bankName: 'BANK NAME',
    bankAddress: 'BANK ADDRESS DETAILS',
    paymentNote: 'Please process the bank transfer to the bank account listed above and set it up for us to receive the exact amount listed. Once processed, kindly share a copy or screenshot of the bank transfer with your surf travel consultant so we can track it and confirm receipt.',
    bookingId: 'BOOKING ID XXXX',
    supplierName: 'SUPPLIER NAME',
    customerFullName: 'CUSTOMER FULL NAME',
    showBookingSummary: true,
    showBookingId: true,
    showSupplier: true,
    showCustomerName: true,
    showPackage: true,
    showAdults: true,
    showDates: true,
    showAccommodation: true,
    showInclusions: true,
    package: 'PACKAGE NAME',
    adults: '2',
    dates: 'MONTH DDth - DDnd, YYYY | X nights',
    accommodation: 'ACCOMMODATION DETAILS',
    inclusions: 'All listed inclusions in the original offer',
    showBookingDescription: true,
    bookingDescription: '',
    bookingIDHeader: 'BOOKING DESCRIPTION',
    bookingIDLabel: 'Booking ID:',
  });

  // Logo settings
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
    file: null,
    width: 200,
    height: 100,
    position: { x: 0, y: 0 }
  });

  // Secondary logo settings (for pages after the first page)
  const [secondaryLogoSettings, setSecondaryLogoSettings] = useState<SecondaryLogoSettings>({
    file: null,
    width: 200,
    height: 100,
    position: { x: 0, y: 0 }
  });

  // Thank you page settings
  const [thankYouSettings, setThankYouSettings] = useState<ThankYouSettings>({
    file: null
  });

  // Preview URL states
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState<string | null>(null);
  const [thankYouUrl, setThankYouUrl] = useState<string | null>(null);

  // Load logo when file changes
  useEffect(() => {
    if (logoSettings.file) {
      const url = URL.createObjectURL(logoSettings.file);
      setLogoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [logoSettings.file]);

  // Load secondary logo when file changes
  useEffect(() => {
    if (secondaryLogoSettings.file) {
      const url = URL.createObjectURL(secondaryLogoSettings.file);
      setSecondaryLogoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [secondaryLogoSettings.file]);

  // Load thank you image when file changes
  useEffect(() => {
    if (thankYouSettings.file) {
      const url = URL.createObjectURL(thankYouSettings.file);
      setThankYouUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [thankYouSettings.file]);

  // UI state - panels
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Panel dimensions state
  const [dimensions, setDimensions] = useState({
    width: 500,
    height: 800,
    minWidth: 300,
    maxWidth: 1200
  });

  // Set initial dimensions on client side
  useEffect(() => {
    setDimensions({
      width: 500,
      height: window.innerHeight - 200,
      minWidth: 300,
      maxWidth: window.innerWidth - 400
    });

    const handleResize = () => {
      setDimensions(prev => ({
        ...prev,
        height: window.innerHeight - 200,
        maxWidth: window.innerWidth - 400
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // PDF generation function
  const generatePDF = async () => {
    if (generatingPdf) return; // Prevent multiple calls
    
    try {
      setGeneratingPdf(true);
      console.log('Starting PDF generation...');
      
      // Get the invoice container element
      const invoiceElement = document.getElementById('invoice-preview');
      if (!invoiceElement) {
        throw new Error('Invoice preview element not found');
      }
      
      // Add a notification for debugging
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.padding = '10px 20px';
      notification.style.backgroundColor = 'rgba(0,0,0,0.7)';
      notification.style.color = 'white';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '9999';
      notification.textContent = 'Generating PDF...';
      document.body.appendChild(notification);
      
      // Force any pending state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await generatePdfDocument(invoiceData, logoUrl, thankYouUrl, secondaryLogoUrl);
      
      // Update notification
      notification.textContent = 'PDF Downloaded!';
      notification.style.backgroundColor = 'rgba(0,128,0,0.7)';
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      
      console.log('PDF generation completed');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Panel toggle functions
  const toggleFormPanel = () => {
    setIsFormCollapsed(!isFormCollapsed);
    if (isPreviewCollapsed) setIsPreviewCollapsed(false);
  };

  const togglePreviewPanel = () => {
    setIsPreviewCollapsed(!isPreviewCollapsed);
    if (isFormCollapsed) setIsFormCollapsed(false);
  };

  // Expand form to full width
  const expandForm = () => {
    setIsFormCollapsed(false);
    setIsPreviewCollapsed(true);
  };

  // Expand preview to full width
  const expandPreview = () => {
    setIsPreviewCollapsed(false);
    setIsFormCollapsed(true);
  };

  // Reset to default view
  const resetPanels = () => {
    setIsFormCollapsed(false);
    setIsPreviewCollapsed(false);
  };

  // Get classes based on panel state
  const getFormPanelClasses = () => {
    return isFormCollapsed ? 'col-span-1' : isPreviewCollapsed ? 'col-span-12' : 'col-span-5';
  };

  const getPreviewPanelClasses = () => {
    return isPreviewCollapsed ? 'col-span-1' : isFormCollapsed ? 'col-span-12' : 'col-span-7';
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Head>
        <title>Glide Invoice Generator</title>
        <meta name="description" content="Generate professional invoices for Glide" />
        <link rel="icon" href="/favicon.ico" />
        <style jsx global>{`
          .react-resizable {
            position: relative;
          }
          .react-resizable-handle {
            position: absolute;
            right: -5px;
            bottom: 0;
            top: 0;
            width: 10px;
            cursor: col-resize;
            background-color: rgba(0,0,0,0.05);
            transition: background-color 0.2s;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .react-resizable-handle:hover {
            background-color: rgba(0,0,0,0.1);
          }
          .react-resizable-handle::after {
            content: "";
            width: 2px;
            height: 50px;
            background-color: #ccc;
            border-radius: 1px;
          }
          .react-resizable-handle:hover::after {
            background-color: #999;
          }
        `}</style>
      </Head>

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          {/* Top Export Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={generatePDF}
              disabled={generatingPdf}
              className="bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 transition flex items-center font-semibold text-base shadow-md"
            >
              {generatingPdf ? 'Generating PDF...' : 'Export PDF'}
            </button>
          </div>
          
          <div className="flex">
            {/* Form Panel */}
            <ResizableBox
              width={dimensions.width}
              height={dimensions.height}
              minConstraints={[dimensions.minWidth, dimensions.height]}
              maxConstraints={[dimensions.maxWidth, dimensions.height]}
              resizeHandles={['e']}
              axis="x"
              className="bg-white p-4 overflow-y-auto relative"
              style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
            >
              <InvoiceForm
                defaultValues={invoiceData}
                onUpdate={setInvoiceData}
                logoSettings={logoSettings}
                setLogoSettings={setLogoSettings}
                secondaryLogoSettings={secondaryLogoSettings}
                setSecondaryLogoSettings={setSecondaryLogoSettings}
                thankYouSettings={thankYouSettings}
                setThankYouSettings={setThankYouSettings}
                generatePDF={generatePDF}
              />
            </ResizableBox>

            {/* Preview Panel */}
            <div className="flex-1 bg-white ml-4 p-4 relative overflow-y-auto" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
              <InvoicePreview
                invoiceData={invoiceData}
                logoSettings={logoSettings}
                secondaryLogoSettings={secondaryLogoSettings}
                thankYouSettings={thankYouSettings}
                logoUrl={logoUrl}
                secondaryLogoUrl={secondaryLogoUrl}
                thankYouUrl={thankYouUrl}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black text-gray-300 py-4 text-center text-sm">
        <div className="container mx-auto">
          &copy; {new Date().getFullYear()} Glide Invoice Generator
        </div>
      </footer>
    </div>
  );
}
