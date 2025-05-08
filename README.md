# Glide Invoice Generator

A professional, modern invoice generator for Glide Surf & Snow Travel.

## Features

- Split-screen interface with form controls on the left and live preview on the right
- Dynamic layout adaptation that automatically adjusts when content changes
- Multi-page support with specific content organization
  - First page for essential invoice info
  - Middle pages for booking description details with automatic page creation as needed
  - Final page for a customizable thank you message
- Toggle sections on/off based on client needs
- Logo upload with position and size controls
- PDF export functionality
- Responsive design for desktop and mobile use

## Tech Stack

- Next.js for the React framework
- TypeScript for type safety
- TailwindCSS for styling
- React Hook Form for form management
- JsPDF and html2canvas for PDF generation

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 7.x or higher

### Installation

1. Clone the repository:

```bash
git clone https://your-repository-url/glide-invoice-generator.git
cd glide-invoice-generator
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Form Controls

The form is divided into tabs for easy navigation:

1. **Invoice Info**: Basic invoice details like number, date, and customer ID.
2. **Client Info**: Client contact information.
3. **Payment**: Deposit and balance payment details, with optional offer pending section.
4. **Booking**: Booking details and summary information.
5. **Description**: Detailed booking description that can span multiple pages.
6. **Logo & Branding**: Upload and position logo, and add a thank you page.
7. **Settings**: Generate and download the final PDF.

### PDF Generation

Click the "Generate & Download PDF" button in the Settings tab to create and download a PDF of the invoice. The PDF will maintain the exact layout and formatting as seen in the preview.

### Fonts

The application uses:
- Roboto Condensed Bold for titles
- Roboto Light for normal text
- Text sizes vary based on content importance:
  - 10pt for most content
  - 8pt for header and note sections
  - 15pt for main section titles

## Customization

You can customize various aspects of the invoice:

- Toggle sections on/off
- Upload your company logo and position it as needed
- Add a custom thank you page
- Adjust all text content through the form

## Development

### Project Structure

```
glide-invoice-generator/
├── src/
│   ├── components/        # React components
│   │   ├── InvoiceForm.tsx    # Form for editing invoice data
│   │   └── InvoicePreview.tsx # Preview of the invoice
│   ├── pages/             # Next.js pages
│   │   └── index.tsx      # Main application page
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # Invoice data type definitions
│   └── utils/             # Utility functions
│       └── pdfGenerator.ts # PDF generation utilities
└── public/                # Static assets
```

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `.next` folder.

To start the production server:

```bash
npm start
```

## License

Copyright © 2023 Glide Surf & Snow Travel Ltd. All rights reserved.
