import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceData, LogoSettings, ThankYouSettings } from '../types';

// Completely revamp the HTML to PDF conversion with direct control over rendering
export const htmlToPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    // Create PDF with A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    
    // A4 constants
    const A4_WIDTH = 210; // mm
    const A4_HEIGHT = 297; // mm
    
    // Find all invoice pages
    const pages = element.querySelectorAll('.invoice-page');
    
    if (!pages.length) {
      console.error('No pages found to export');
      throw new Error('No pages found to export');
    }
    
    console.log(`Found ${pages.length} pages to export`);
    
    // Before processing any pages, ensure all images are properly loaded
    await preloadAllImages(element);
    
    // We'll only add export mode attribute to the cloned document, not the original
    // to prevent visible changes during export
    // DO NOT set data-pdf-export-mode on the original element
    // element.setAttribute('data-pdf-export-mode', 'true');
    
    // Process each page sequentially
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      
      if (i > 0) {
        // Add a new page for each page after the first
        pdf.addPage('a4', 'portrait');
      }
      
      try {
        console.log(`Rendering page ${i + 1}/${pages.length}`);
        
        // Check if this is a Thank You page
        const isThankYouPage = page.id === 'invoice-thank-you';
        
        // Store original styles
        const originalStyles = {
          width: page.style.width,
          height: page.style.height,
          position: page.style.position,
          overflow: page.style.overflow
        };
        
        // Temporarily set visibility: visible on all elements to ensure content is captured
        const allElements = page.querySelectorAll('*');
        const originalVisibility: {[key: string]: string} = {};
        
        allElements.forEach((el, idx) => {
          if (el instanceof HTMLElement) {
            originalVisibility[idx] = el.style.visibility;
            el.style.visibility = 'visible';
          }
        });
        
        // Set exact A4 dimensions for rendering
        page.style.width = `${A4_WIDTH}mm`;
        page.style.height = `${A4_HEIGHT}mm`;
        page.style.position = 'relative';
        
        // Special handling for Thank You page
        if (isThankYouPage) {
          // Special rendering for Thank You page to prevent white lines
          console.log('Rendering Thank You page with special treatment');
          
          // For Thank You page, force background to black
          page.style.backgroundColor = '#000000';
          page.style.padding = '0';
          page.style.margin = '0';
          page.style.overflow = 'hidden';
          
          // Get the image
          const img = page.querySelector('img[data-pdf-element="thank-you-image"]');
          if (img instanceof HTMLImageElement) {
            // Set absolute dimensions
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = `${A4_WIDTH}mm`;
            img.style.height = `${A4_HEIGHT}mm`;
            img.style.margin = '0';
            img.style.padding = '0';
            img.style.border = '0';
            img.style.objectFit = 'cover';
          }
        } else {
          // For normal pages, overflow can be visible
          page.style.overflow = 'visible';
        }
                
        // Use higher scale for better quality rendering
        const scale = isThankYouPage ? 5 : 3; // Higher scale for thank you page
        
        // PDF-SPECIFIC COMPENSATION FOR OFFER PENDING BOX RENDERED BY HTML2CANVAS
        // const offerPendingBoxOnPage = page.querySelector('[data-pdf-element="offer-pending-box"]');
        // if (offerPendingBoxOnPage instanceof HTMLElement) {
        //     console.log('[htmlToPdf] PRE-HTML2CANVAS: REMOVING ALL PREVIOUS ATTEMPTS HERE.');
        //     offerPendingBoxOnPage.style.backgroundColor = ''; 
        //     offerPendingBoxOnPage.style.paddingBottom = ''; // Reset to original
        //     const paragraphsInOfferPending = offerPendingBoxOnPage.querySelectorAll('p');
        //     paragraphsInOfferPending.forEach(p => {
        //         if (p instanceof HTMLElement) {
        //             p.style.position = 'static'; 
        //             p.style.top = 'auto';      
        //             p.style.paddingTop = '0px'; 
        //         }
        //     });
        // } else {
        //     console.log('[htmlToPdf] PRE-HTML2CANVAS: Offer Pending Box NOT found on current page, no pre-styles to remove.');
        // }

        // Render the page to canvas with custom settings based on page type
        const canvas = await html2canvas(page, {
          scale: scale, 
          useCORS: true,
          allowTaint: true,
          logging: true, // Enable html2canvas logging for more insights
          backgroundColor: isThankYouPage ? '#000000' : '#FFFFFF',
          onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
            console.log('[htmlToPdf onclone] Executing onclone. Attempting to add spacer to Offer Pending Box.');
            clonedDoc.documentElement.setAttribute('data-pdf-export-mode', 'true');
            
            const styleTag = clonedDoc.createElement('style');
            styleTag.textContent = `[data-pdf-export-mode="true"] { /* Minimal styling */ }`;
            clonedDoc.head.appendChild(styleTag);

            const allElementsInClonedCanvasInput = clonedElement.querySelectorAll('*');
            allElementsInClonedCanvasInput.forEach(el => {
              if (el instanceof HTMLElement) {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
                el.style.display = window.getComputedStyle(el).display !== 'none' ? window.getComputedStyle(el).display : 'block'; 
              }
            });

            // CORE FIX: Add a spacer div to the Offer Pending Box if found in this clonedElement
            const offerPendingBoxInEffect = clonedElement.querySelector('[data-pdf-element="offer-pending-box"]');
            if (offerPendingBoxInEffect instanceof HTMLElement) {
                console.log('[htmlToPdf onclone] Offer Pending Box FOUND in onclone context. Appending 4px spacer div.');
                const spacerDiv = clonedDoc.createElement('div');
                spacerDiv.style.height = '4px'; // Create 4px of space
                spacerDiv.style.width = '100%';
                spacerDiv.style.backgroundColor = 'transparent'; // Make it invisible, just for spacing
                offerPendingBoxInEffect.appendChild(spacerDiv);
            } else {
                console.log('[htmlToPdf onclone] Offer Pending Box NOT FOUND in onclone context.');
            }

            // Specific handling for Thank You page (existing logic)
            const clonedPageElementForThankYouCheck = clonedElement;
            if (clonedPageElementForThankYouCheck.id === 'invoice-thank-you') {
                console.log('[htmlToPdf onclone] Special handling for Thank You page in onclone.');
            }
            
            // Handle booking description as before (existing logic)
            const descriptions = clonedElement.querySelectorAll('.booking-description'); 
            descriptions.forEach(desc => {
              if (desc instanceof HTMLElement) {
                const container = desc.parentElement;
                if (container) {
                  container.classList.add('booking-description-container');
                  container.style.position = 'relative';
                  container.style.boxSizing = 'border-box';
                  container.style.paddingBottom = '22mm'; 
                  desc.style.overflow = 'visible';
                  desc.style.maxHeight = 'none';
                  const paragraphs = desc.querySelectorAll('p');
                  const lastParagraph = paragraphs[paragraphs.length - 1];
                  if (lastParagraph) {
                    lastParagraph.style.marginBottom = '0';
                    lastParagraph.style.paddingBottom = '0';
                    lastParagraph.style.position = 'relative';
                  }
                  const oncloneSpacer = clonedDoc.createElement('div'); // Renamed to avoid conflict
                  oncloneSpacer.style.height = '5mm';
                  oncloneSpacer.style.width = '100%';
                  oncloneSpacer.style.position = 'relative';
                  oncloneSpacer.style.display = 'block';
                  desc.appendChild(oncloneSpacer);
                }
              }
            });
          }
        } as any);
        
        // Restore original styles
        page.style.width = originalStyles.width;
        page.style.height = originalStyles.height;
        page.style.position = originalStyles.position;
        page.style.overflow = originalStyles.overflow;
        
        // Restore original visibility
        allElements.forEach((el, idx) => {
          if (el instanceof HTMLElement) {
            el.style.visibility = originalVisibility[idx] || '';
          }
        });
        
        // For Thank You page, use special rendering to avoid white lines
        if (isThankYouPage) {
          // Use a pure black page
          pdf.setFillColor(0, 0, 0);
          pdf.rect(0, 0, A4_WIDTH, A4_HEIGHT, 'F');
          
          // Add the image with exact positioning
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
        } else {
          // Standard image addition for normal pages
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
        }
        
        console.log(`Added page ${i + 1} to PDF`);
      } catch (err) {
        console.error(`Error rendering page ${i + 1}:`, err);
        throw err;
      }
    }
    
    // No need to remove export attributes since we didn't add them to the original document
    // document.documentElement.removeAttribute('data-pdf-export-mode');
    // element.removeAttribute('data-pdf-export-mode');
    
    // Save the PDF
    if (filename) {
      pdf.save(filename);
    } else {
      pdf.save('invoice.pdf');
    }
    
    console.log('PDF generated and downloaded successfully');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Improved image preloading function
const preloadAllImages = async (element: HTMLElement): Promise<void> => {
  console.log('Preloading all images...');
  
  // Find all images in the document
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    if (img instanceof HTMLImageElement) {
      // Force image to load if not already loaded
      if (!img.complete || img.naturalHeight === 0) {
        return new Promise<void>((resolve) => {
          img.onload = () => {
            console.log(`Image loaded: ${img.src}`);
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load image: ${img.src}`);
            resolve(); // Resolve anyway to continue the process
          };
          
          // If the image has no src or it's invalid, resolve immediately
          if (!img.src || img.src === 'null' || img.src === 'undefined' || img.src === '') {
            resolve();
          }
        });
      }
    }
    return Promise.resolve();
  });
  
  // Wait for all images to load
  await Promise.all(imagePromises);
  console.log('All images preloaded successfully');
  
  // Wait an additional 200ms to ensure rendering is complete
  await new Promise(resolve => setTimeout(resolve, 200));
};

// Function that will be used as the default export
const generatePdfDocument = async (
  invoiceData: InvoiceData,
  logoUrl: string | null,
  thankYouUrl: string | null,
  secondaryLogoUrl: string | null
): Promise<void> => {
  try {
    // Get the invoice container element
    const invoiceElement = document.getElementById('invoice-preview');
    if (!invoiceElement) {
      throw new Error('Invoice preview element not found');
    }
    
    // Add notification
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
    
    // Create a deep clone of the invoice element to use for PDF generation
    // This completely prevents any visible glitches in the UI
    const clonedElement = invoiceElement.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '-9999px';
    clonedElement.style.opacity = '0';
    clonedElement.style.pointerEvents = 'none';
    document.body.appendChild(clonedElement);
    
    // Make all elements in the cloned container visible during export
    const allElements = clonedElement.querySelectorAll('*');
    allElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.visibility = 'visible';
      }
    });
    
    // Ensure booking-description doesn't get cut off in clone
    const descriptions = clonedElement.querySelectorAll('.booking-description');
    descriptions.forEach(desc => {
      if (desc instanceof HTMLElement) {
        desc.style.overflow = 'visible';
        desc.style.maxHeight = 'none';
      }
    });
    
    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Generate PDF using the invisible clone
    // Clean the invoice number to make it filename-safe
    const cleanInvoiceNumber = invoiceData.invoiceNumber?.replace(/[^a-zA-Z0-9\-_]/g, '') || 'Unknown';
    const filename = `Invoice ${cleanInvoiceNumber}.pdf`;
    
    await htmlToPdf(clonedElement, filename);
    
    // Remove the cloned element from the DOM
    document.body.removeChild(clonedElement);
    
    // Update notification
    notification.textContent = 'PDF Downloaded!';
    notification.style.backgroundColor = 'rgba(0,128,0,0.7)';
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export default generatePdfDocument;

// Backward compatibility functions
export const generatePDF = async (
  invoiceData: InvoiceData,
  logoSettings: LogoSettings,
  thankYouSettings: ThankYouSettings
): Promise<Blob> => {
  // Get the invoice container element
  const invoiceElement = document.getElementById('invoice-preview');
  if (!invoiceElement) {
    throw new Error('Invoice preview element not found');
  }

  // Create a new PDF document
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  try {
    // Use the improved rendering method
    await htmlToPdf(invoiceElement, '');
  } catch (error) {
    console.error('Error in htmlToPdf:', error);
  }
  
  // Return the PDF as a blob
  return pdf.output('blob');
};

export const downloadPDF = async (
  invoiceData: InvoiceData,
  logoSettings: LogoSettings,
  thankYouSettings: ThankYouSettings
): Promise<void> => {
  try {
    // Get the invoice container element
    const invoiceElement = document.getElementById('invoice-preview');
    if (!invoiceElement) {
      throw new Error('Invoice preview element not found');
    }
    
    // Use the improved rendering method
    // Clean the invoice number to make it filename-safe
    const cleanInvoiceNumber = invoiceData.invoiceNumber?.replace(/[^a-zA-Z0-9\-_]/g, '') || 'Unknown';
    const filename = `Invoice ${cleanInvoiceNumber}.pdf`;
    
    await htmlToPdf(invoiceElement, filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};