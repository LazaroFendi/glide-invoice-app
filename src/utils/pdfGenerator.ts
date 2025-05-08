import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceData, LogoSettings, ThankYouSettings } from '../types';

// The most reliable way to convert HTML to PDF is to capture each page as a high-resolution image
// and place it exactly in the PDF document at A4 size
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
    
    // Process each page sequentially
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      
      if (i > 0) {
        // Add a new page for each page after the first
        pdf.addPage('a4', 'portrait');
      }
      
      try {
        console.log(`Rendering page ${i + 1}/${pages.length}`);
        
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
        
        // Set exact A4 dimensions for rendering and ensure overflow is visible during capture
        page.style.width = `${A4_WIDTH}mm`;
        page.style.height = `${A4_HEIGHT}mm`;
        page.style.position = 'relative';
        page.style.overflow = 'visible';
        
        // Render the page to canvas with higher scale for better quality
        const canvas = await html2canvas(page, {
          scale: 3, // Higher scale for better quality
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          onclone: (clonedDoc: Document) => {
            // Ensure text is not cut off in the cloned document
            const clonedPage = clonedDoc.querySelector(`.invoice-page:nth-child(${i + 1})`) as HTMLElement;
            if (clonedPage) {
              const descriptions = clonedPage.querySelectorAll('.booking-description');
              descriptions.forEach(desc => {
                if (desc instanceof HTMLElement) {
                  // Create container with extra padding if it doesn't exist
                  const container = desc.parentElement;
                  if (container) {
                    container.classList.add('booking-description-container');
                    
                    // Enforce strict bottom margin
                    container.style.position = 'relative';
                    container.style.boxSizing = 'border-box';
                    container.style.paddingBottom = '22mm'; // Reduced from 25mm to 22mm to allow more content while keeping safe margin
                    
                    // Set overflow to visible but maintain strict bottom margin
                    desc.style.overflow = 'visible';
                    desc.style.maxHeight = 'none';
                    
                    // Find all paragraphs that would exceed the 2cm margin
                    const paragraphs = desc.querySelectorAll('p');
                    
                    // Ensure last paragraph is never cut off by adding more padding
                    const lastParagraph = paragraphs[paragraphs.length - 1];
                    if (lastParagraph) {
                      lastParagraph.style.marginBottom = '0';
                      lastParagraph.style.paddingBottom = '0';
                      
                      // Set position to stop any overflow
                      lastParagraph.style.position = 'relative';
                    }
                    
                    // Add a spacer div at the end to enforce margin if needed
                    const spacer = clonedDoc.createElement('div');
                    spacer.style.height = '5mm';
                    spacer.style.width = '100%';
                    spacer.style.position = 'relative';
                    spacer.style.display = 'block';
                    desc.appendChild(spacer);
                  }
                }
              });
            }
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
        
        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png');
        
        // Add the image to the PDF - ensure it covers the exact A4 size
        pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
        
        console.log(`Added page ${i + 1} to PDF`);
      } catch (err) {
        console.error(`Error rendering page ${i + 1}:`, err);
        throw err;
      }
    }
    
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
    
    // Make all elements in the invoice container temporarily visible during export
    const allElements = invoiceElement.querySelectorAll('*');
    const originalVisibility: {[key: string]: string} = {};
    
    allElements.forEach((el, idx) => {
      if (el instanceof HTMLElement) {
        originalVisibility[idx] = el.style.visibility;
        el.style.visibility = 'visible';
      }
    });
    
    // Ensure booking-description doesn't get cut off
    const descriptions = invoiceElement.querySelectorAll('.booking-description');
    const originalOverflow: {[key: string]: string} = {};
    const originalMaxHeight: {[key: string]: string} = {};
    
    descriptions.forEach((desc, idx) => {
      if (desc instanceof HTMLElement) {
        originalOverflow[idx] = desc.style.overflow;
        originalMaxHeight[idx] = desc.style.maxHeight;
        desc.style.overflow = 'visible';
        desc.style.maxHeight = 'none';
      }
    });
    
    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Add export mode data attribute for special export styling
    invoiceElement.setAttribute('data-pdf-export-mode', 'true');
    
    // Generate PDF
    await htmlToPdf(invoiceElement, `GLIDE_Invoice_${invoiceData.invoiceNumber}.pdf`);
    
    // Remove export mode data attribute
    invoiceElement.removeAttribute('data-pdf-export-mode');
    
    // Restore visibility
    allElements.forEach((el, idx) => {
      if (el instanceof HTMLElement) {
        el.style.visibility = originalVisibility[idx] || '';
      }
    });
    
    // Restore overflow settings
    descriptions.forEach((desc, idx) => {
      if (desc instanceof HTMLElement) {
        desc.style.overflow = originalOverflow[idx] || '';
        desc.style.maxHeight = originalMaxHeight[idx] || '';
      }
    });
    
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
    await htmlToPdf(invoiceElement, `GLIDE_Invoice_${invoiceData.invoiceNumber}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};