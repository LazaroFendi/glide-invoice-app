export interface InvoiceData {
  // Invoice Information
  invoiceNumber: string;
  customerId: string;
  date: string;
  supplier: string;
  
  // Client Information
  clientName: string;
  clientAddress: string;
  clientAreaZipCode: string;
  clientCity: string;
  clientCountry: string;
  
  // Offer Pending
  showOfferPending: boolean;
  offerDeposit: string;
  offerDueDate: string;
  offerPendingTitle?: string;
  offerPendingText?: string;
  
  // Main Titles
  supplierBookingTitle: string;
  bookingDescriptionTitle: string;
  
  // Payment Information
  descriptionTitle: string;
  depositDueDate: string;
  depositAmount: string;
  depositDescription?: string;
  balanceDueDate: string;
  balanceAmount: string;
  balanceDescription?: string;
  totalAmount: string;
  paymentItems: PaymentItem[];
  
  // Payment Instructions
  showPaymentInstructions: boolean;
  showAccountHolder: boolean;
  showAccountNumber: boolean;
  showRoutingNumber: boolean;
  showSwiftBic: boolean;
  showBankName: boolean;
  showBankAddress: boolean;
  accountHolder: string;
  accountNumber: string;
  routingNumber: string;
  swiftBic: string;
  bankName: string;
  bankAddress: string;
  paymentNote: string;
  
  // Booking Information
  bookingId: string;
  supplierName: string;
  customerFullName: string;
  
  // Booking Summary
  showBookingSummary: boolean;
  showBookingId: boolean;
  showSupplier: boolean;
  showCustomerName: boolean;
  showPackage: boolean;
  showAdults: boolean;
  showDates: boolean;
  showAccommodation: boolean;
  showInclusions: boolean;
  package: string;
  adults: string;
  dates: string;
  accommodation: string;
  inclusions: string;
  
  // Booking Description
  showBookingDescription: boolean;
  bookingDescription: string;
  bookingIDHeader: string;
  bookingIDLabel: string;
  
  // Feature toggles
  showInvoiceNumber?: boolean;
  showDate?: boolean;
  showCustomerId?: boolean;
  
  // Payment items display options
  showItemsTable?: boolean;
  showOnlyTotal?: boolean;
  currency?: string;
  bookingSummaryDetails?: string;
}

export interface PaymentItem {
  name: string;
  description: string;
  dueDate?: string;
  amount: number | string;
}

export interface LogoSettings {
  file: File | null;
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
}

export interface SecondaryLogoSettings {
  file: File | null;
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
}

export interface ThankYouSettings {
  file: File | null;
} 