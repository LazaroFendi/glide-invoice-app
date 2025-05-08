import React, { useEffect, useState, useRef, CSSProperties, useMemo } from 'react';
import { InvoiceData, LogoSettings, ThankYouSettings, SecondaryLogoSettings, PaymentItem } from '../types';

interface InvoicePreviewProps {
  invoiceData: InvoiceData;
  logoSettings: LogoSettings;
  secondaryLogoSettings: SecondaryLogoSettings;
  thankYouSettings: ThankYouSettings;
  logoUrl: string | null;
  secondaryLogoUrl: string | null;
  thankYouUrl: string | null;
  inPdfMode?: boolean;
}

// Add this outside the component to ensure consistent styling across all instances
const logoStyle: CSSProperties = {
  position: 'absolute',
  objectFit: 'contain',
  maxWidth: '100%',
  maxHeight: '100%',
  transform: 'translateZ(0)',
  imageRendering: 'auto'
};

// First, simplify the logo rendering with a direct approach
const renderLogo = (logoUrl: string, logoSettings: LogoSettings, id: string = 'logo') => {
  const containerStyle = {
    position: 'absolute' as const,
    top: `${logoSettings.position.y}px`,
    right: `${logoSettings.position.x}px`,
    width: `${logoSettings.width}px`,
    height: `${logoSettings.height}px`,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div style={containerStyle} id={id}>
      <img 
        src={logoUrl}
        alt="Logo" 
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

// Format currency helper
const formatCurrency = (amount: string | number, currency = 'USD') => {
  if (amount === undefined || amount === null) return '';
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' 
    ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) 
    : amount;
  
  // Check if conversion resulted in a valid number
  if (isNaN(numericAmount)) return amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(numericAmount);
};

// Calculate total from payment items
const calculateTotal = (items: PaymentItem[] = []): number => {
  if (!items || items.length === 0) return 0;
  
  return items.reduce((total, item) => {
    if (!item.amount) return total;
    
    const amount = typeof item.amount === 'string'
      ? parseFloat(item.amount.replace(/[^0-9.-]+/g, ''))
      : item.amount;
      
    return isNaN(amount) ? total : total + amount;
  }, 0);
};

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoiceData,
  logoSettings,
  secondaryLogoSettings,
  thankYouSettings,
  logoUrl,
  secondaryLogoUrl,
  thankYouUrl,
  inPdfMode = false,
}) => {
  const [descriptionPages, setDescriptionPages] = useState<string[][]>([]);
  const bookingDescRef = useRef<HTMLDivElement>(null);
  
  // Memoize the logo settings to prevent unnecessary re-renders
  const effectiveSecondaryLogoSettings = useMemo(() => {
    return secondaryLogoSettings;
  }, [secondaryLogoSettings]);
  
  useEffect(() => {
    // Store logo position in CSS variables
    if (logoSettings) {
      document.documentElement.style.setProperty('--logo-top', `${logoSettings.position.y}px`);
      document.documentElement.style.setProperty('--logo-right', `${logoSettings.position.x}px`);
      document.documentElement.style.setProperty('--logo-width', `${logoSettings.width}px`);
      document.documentElement.style.setProperty('--logo-height', `${logoSettings.height}px`);
    }
  }, [
    logoSettings?.position?.x,
    logoSettings?.position?.y, 
    logoSettings?.width, 
    logoSettings?.height
  ]);

  // Calculate and split description into pages
  useEffect(() => {
    if (!invoiceData.showBookingDescription || !invoiceData.bookingDescription) {
      setDescriptionPages([]);
      return;
    }

    // Split text by paragraphs while preserving empty lines
    const paragraphs = invoiceData.bookingDescription.split('\n');
    
    // For more accurate pagination estimate: 
    // - A4 with 2cm margins can fit approximately 51 lines of text at 10pt
    // - Be more conservative to ensure content stays well within margins
    // - Use 49 lines to fit 3 more lines while still maintaining margin safety
    const LINES_PER_PAGE = 49; // Increased from 46 to 49 as requested
    const CHARS_PER_LINE = 80; // Approximate count for A4 width with margins
    
    // Initialize pagination variables
    const pages: string[][] = [];
    let currentPage: string[] = [];
    let currentLineCount = 0;
    
    // Title takes approx 3 lines including spacing
    currentLineCount += 3;
    
    // Process each paragraph for pagination
    paragraphs.forEach((paragraph) => {
      // Empty paragraphs still count as a line break
      if (paragraph.trim() === '') {
        currentLineCount += 0.5; // Count empty lines more significantly
        currentPage.push(''); // Keep empty lines for spacing
        return;
      }
      
      // Calculate how many lines this paragraph will take
      // Longer paragraphs need more precise calculation
      const estimatedLines = Math.max(1, Math.ceil(paragraph.length / CHARS_PER_LINE));
      
      // Add a larger safety buffer for the paragraph
      const totalLinesNeeded = estimatedLines + 0.3; // Increased buffer for safety
      
      // If adding this paragraph would overflow the page or even get close to the margin,
      // start a new page - leave a smaller buffer (2 lines) at the bottom to fit more content
      if (currentLineCount + totalLinesNeeded > LINES_PER_PAGE - 2) {
        if (currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [];
          currentLineCount = 3; // Reset with space for title
        }
      }
      
      // Add paragraph to current page
      currentPage.push(paragraph);
      currentLineCount += totalLinesNeeded;
    });
    
    // Add the last page if it has content
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    
    setDescriptionPages(pages);
  }, [
    invoiceData.showBookingDescription, 
    invoiceData.bookingDescription
  ]);

  // Calculate the correct page number, skipping the Thank You page
  const getPageNumber = (pageIdx: number) => {
    // If you have a thank you page, it should not be counted
    // Assume pages is the array of all pages except thank you
    // If you render all pages in a loop, just use the index + 1
    return pageIdx + 1;
  };

  // Return the complete invoice preview
  return (
    <div id="invoice-preview" className="invoice-preview">
      {/* First Page - Invoice Details */}
      <div id="invoice-first-page" className="invoice-page" style={{ position: 'relative' }}>
        <div className="invoice-content">
          {/* Header Section */}
          <div className="relative mb-4">
            <div>
              <h1 className="invoice-heading mb-1">
                INVOICE FOR:
              </h1>
              <div className="invoice-text">
                <p>{invoiceData.clientName}</p>
                <p>{invoiceData.clientAddress}</p>
                <p>{invoiceData.clientAreaZipCode}</p>
                <p>{invoiceData.clientCity}</p>
                <p>{invoiceData.clientCountry}</p>
              </div>
            </div>

            {/* Logo Position - First page */}
            {logoUrl && renderLogo(logoUrl, logoSettings, "first-page-logo")}

            {/* Company Header on the right - moved back to -10mm */}
            <div 
              style={{ 
                position: 'absolute', 
                top: '25px',
                right: '-10mm', /* Move back to -10mm from right edge */
                textAlign: 'right',
              }} 
              className="invoice-small-text"
              id="company-header"
            >
              <p style={{ fontSize: '8pt', fontWeight: 300, lineHeight: 1.1, marginBottom: '0' }}>GLIDE SURF & SNOW TRAVEL LTD</p>
              <p style={{ lineHeight: 1.1, marginBottom: '0' }}>85 GREAT PORTLAND STREET FIRST FLOOR</p>
              <p style={{ lineHeight: 1.1, marginBottom: '0' }}>W1W 7LT LONDON | UNITED KINGDOM</p>
            </div>
          </div>

          {/* Supplier Booking Info */}
          <div className="mb-4">
            <h2 className="invoice-title mb-2">
              {invoiceData.supplierBookingTitle}
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="invoice-text">
              <div>
                {invoiceData.showDate && (
                  <p>
                    <span className="invoice-heading">DATE</span> {invoiceData.date}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {invoiceData.showInvoiceNumber && (
                  <p>
                    <span className="invoice-heading">INVOICE N°</span> {invoiceData.invoiceNumber}
                  </p>
                )}
                {invoiceData.showCustomerId && (
                  <p>
                    <span className="invoice-heading">CUSTOMER ID</span> {invoiceData.customerId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Offer Pending Section */}
          {invoiceData.showOfferPending && (
            <div className="mb-4" style={{ padding: '6px 8px', borderRadius: '2px', border: '1px solid #e5e7eb' }}>
              <p className="invoice-text mb-0" style={{ textTransform: 'uppercase' }}>
                {invoiceData.offerPendingTitle || "OFFER PENDING:"}
              </p>
              <p className="invoice-text" style={{ lineHeight: '1.2' }}>
                {invoiceData.offerPendingText || `To confirm your booking, you must pay the full deposit of ${invoiceData.offerDeposit} by ${invoiceData.offerDueDate} and balance before due date listed below, otherwise the booking will be cancelled. Please find full booking terms and conditions listed in your booking description.`}
              </p>
            </div>
          )}

          {/* Description and Amounts Section */}
          <div className="mb-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <div style={{ width: '50%', paddingRight: '8px' }}>
                <p className="invoice-heading mb-1">{invoiceData.descriptionTitle}</p>
              </div>
              <div style={{ width: '25%', textAlign: 'left' }}>
                <p className="invoice-heading mb-1">STATUS</p>
              </div>
              <div style={{ width: '25%', textAlign: 'right' }}>
                <p className="invoice-heading mb-1">AMOUNT</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="mt-2">
              {/* Payment Items Table */}
              {invoiceData.showItemsTable && (
                <div style={{ fontFamily: 'Roboto Light, Roboto, sans-serif', fontSize: '10pt', fontWeight: 300 }}>
                  {!invoiceData.showOnlyTotal ? (
                    <>
                      {/* Default payment items if no custom items */}
                      {(!invoiceData.paymentItems || invoiceData.paymentItems.length === 0) ? (
                        <div>
                          <div style={{ display: 'flex', marginBottom: '8px' }}>
                            <div style={{ width: '50%' }}>DEPOSIT PAYMENT</div>
                            <div style={{ width: '25%' }}>DUE ON {invoiceData.depositDueDate}</div>
                            <div style={{ width: '25%', textAlign: 'right' }}>{formatCurrency(invoiceData.depositAmount, invoiceData.currency)}</div>
                          </div>
                          <div style={{ display: 'flex', marginBottom: '8px' }}>
                            <div style={{ width: '50%' }}>BALANCE PAYMENT</div>
                            <div style={{ width: '25%' }}>DUE ON {invoiceData.balanceDueDate}</div>
                            <div style={{ width: '25%', textAlign: 'right' }}>{formatCurrency(invoiceData.balanceAmount, invoiceData.currency)}</div>
                          </div>
                        </div>
                      ) : (
                        // Custom payment items from the array
                        <div>
                          {invoiceData.paymentItems
                            .filter(item => item.description || item.amount) // Skip empty items
                            .map((item, index) => (
                              <div key={`payment-item-${index}`} style={{ display: 'flex', marginBottom: '8px' }}>
                                <div style={{ width: '50%' }}>{item.description || item.name || 'PAYMENT ITEM'}</div>
                                <div style={{ width: '25%' }}>{item.dueDate ? `DUE ON ${item.dueDate}` : ''}</div>
                                <div style={{ width: '25%', textAlign: 'right' }}>{formatCurrency(item.amount, invoiceData.currency)}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  ) : null}
                  
                  {/* Total Row - always shown */}
                  <div style={{ display: 'flex', marginTop: '8px', fontWeight: 'bold' }}>
                    {!invoiceData.showOnlyTotal ? (
                      <>
                        <div style={{ width: '75%' }}>TOTAL AMOUNT</div>
                        <div style={{ width: '25%', textAlign: 'right' }}>
                          {invoiceData.totalAmount 
                            ? formatCurrency(invoiceData.totalAmount, invoiceData.currency)
                            : formatCurrency(calculateTotal(invoiceData.paymentItems), invoiceData.currency)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '50%' }}>TOTAL AMOUNT</div>
                        <div style={{ width: '25%' }}>
                          {invoiceData.paymentItems && invoiceData.paymentItems.length > 0 && invoiceData.paymentItems[0].dueDate ? (
                            <span>DUE ON {invoiceData.paymentItems[0].dueDate}</span>
                          ) : null}
                        </div>
                        <div style={{ width: '25%', textAlign: 'right' }}>
                          {invoiceData.totalAmount 
                            ? formatCurrency(invoiceData.totalAmount, invoiceData.currency)
                            : formatCurrency(calculateTotal(invoiceData.paymentItems), invoiceData.currency)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Instructions */}
          {invoiceData.showPaymentInstructions && (
            <div className="mb-4">
              <p className="invoice-heading mb-1">PAYMENT INSTRUCTIONS</p>
              <div className="invoice-text" style={{ lineHeight: 1.2 }}>
                {invoiceData.showAccountHolder && <p>Account holder: {invoiceData.accountHolder}</p>}
                {invoiceData.showAccountNumber && <p>Account number: {invoiceData.accountNumber}</p>}
                {invoiceData.showRoutingNumber && <p>Routing number: {invoiceData.routingNumber}</p>}
                {invoiceData.showSwiftBic && <p>Swift/BIC: {invoiceData.swiftBic}</p>}
                {invoiceData.showBankName && <p>Bank name: {invoiceData.bankName}</p>}
                {invoiceData.showBankAddress && (
                  <>
                    <p>Bank address:</p>
                    <p>{invoiceData.bankAddress}</p>
                    <p>New York, 10010</p>
                    <p>United States</p>
                  </>
                )}
              </div>
              <p className="invoice-small-text mt-1">
                <span className="invoice-heading" style={{ fontSize: '8pt' }}>NOTE: </span>
                {invoiceData.paymentNote || "Please, process the bank transfer to the bank account listed above and set it up for us to receive the exact amount listed. Once processed, kindly share a copy or screenshot of the bank transfer with your surf travel consultant so we can track it and confirm receipt."}
              </p>
            </div>
          )}

          {/* Booking Summary */}
          {invoiceData.showBookingSummary && (
            <div className="mb-3">
              <p className="invoice-heading mb-1">BOOKING SUMMARY</p>
              <div className="invoice-text" style={{ lineHeight: 1.2 }}>
                {invoiceData.showBookingId && <p>Booking ID: {invoiceData.bookingId}</p>}
                {invoiceData.showSupplier && <p>Supplier: {invoiceData.supplier}</p>}
                {invoiceData.showCustomerName && <p>Customer: {invoiceData.customerFullName}</p>}
                {invoiceData.showPackage && <p>Package: {invoiceData.package}</p>}
                {invoiceData.showAdults && <p>{invoiceData.adults} adults</p>}
                {invoiceData.showDates && <p>{invoiceData.dates}</p>}
                {invoiceData.showAccommodation && <p>{invoiceData.accommodation}</p>}
                {invoiceData.showInclusions && <p>{invoiceData.inclusions}</p>}
              </div>
            </div>
          )}
        </div>
        {/* Page Numbering: show on all pages except Thank You page */}
        <div
          style={{
            position: 'absolute',
            bottom: '1cm', // 1cm from the bottom edge
            right: '1cm', // 1cm from the right edge
            fontSize: '10pt',
            fontFamily: 'Roboto Condensed, Roboto, Arial, sans-serif',
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: '#222',
            opacity: 0.9,
            zIndex: 10,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          Page 1
        </div>
      </div>

      {/* Booking Description Pages */}
      {invoiceData.showBookingDescription && descriptionPages.length > 0 && 
        descriptionPages.map((pageContent, pageIndex) => (
          <div 
            key={`desc-page-${pageIndex}`} 
            id={pageIndex === 0 ? "invoice-booking-description" : `invoice-booking-description-${pageIndex+1}`} 
            className="invoice-page page-break-before"
            style={{ position: 'relative' }}
            data-page-type="booking-description"
          >
            <div className="invoice-content">
              {/* Logo Position - Use secondary logo for description pages */}
              {secondaryLogoUrl && renderLogo(secondaryLogoUrl, effectiveSecondaryLogoSettings, "secondary-page-logo")}
              
              <h2 className="invoice-title mb-2">
                {invoiceData.bookingDescriptionTitle}
              </h2>

              {/* First page has booking ID info */}
              {pageIndex === 0 && (
                <div className="mb-3">
                  <p className="invoice-heading mb-1">{invoiceData.bookingIDHeader}</p>
                  <p className="invoice-text"><strong>{invoiceData.bookingIDLabel}</strong> {invoiceData.bookingId}</p>
                </div>
              )}

              {/* All continuation pages (2nd page onward) show CONT'D subtitle */}
              {pageIndex >= 1 && (
                <div className="mb-3">
                  <p className="invoice-heading mb-1">Booking Description (CONT'D)</p>
                </div>
              )}
              
              <div className="booking-description-container">
                <div className="booking-description" 
                  style={{ 
                    lineHeight: 1.4, 
                    maxHeight: 'calc(297mm - 4cm - 2mm - 3rem)', // Reduced buffer from 5mm to 2mm
                    overflow: 'hidden', // Enforce margins
                    position: 'relative'
                  }}
                >
                  {pageContent.map((paragraph, pIndex) => {
                    // Compute margin once outside render
                    const isLastParagraph = pIndex === pageContent.length - 1;
                    const marginStyle = isLastParagraph ? '0' : '0.35rem';
                    
                    return (
                      <p 
                        key={`p-${pageIndex}-${pIndex}`} 
                        className="invoice-text mb-1" 
                        style={{ 
                          breakInside: 'avoid', 
                          pageBreakInside: 'avoid',
                          marginBottom: marginStyle,
                          position: 'relative' // Ensure proper positioning
                        }}
                      >
                        {paragraph}
                      </p>
                    );
                  })}
                  {/* Add spacer div to enforce bottom margin */}
                  <div style={{ height: '5mm', width: '100%', display: 'block' }}></div>
                </div>
              </div>
            </div>
            {/* Page Numbering: show on all pages except Thank You page */}
            <div
              style={{
                position: 'absolute',
                bottom: '1cm', // 1cm from the bottom edge
                right: '1cm', // 1cm from the right edge
                fontSize: '10pt',
                fontFamily: 'Roboto Condensed, Roboto, Arial, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: '#222',
                opacity: 0.9,
                zIndex: 10,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              Page {pageIndex + 2}
            </div>
          </div>
        ))
      }

      {/* Thank You Page if available */}
      {thankYouUrl && (
        <div id="invoice-thank-you" className="invoice-page page-break-before">
          {/* Remove the secondary logo from thank you page */}
          <img
            src={thankYouUrl}
            alt="Thank You"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;