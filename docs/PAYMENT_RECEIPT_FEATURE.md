# Official Payment Receipt Feature

## Overview
After recording a payment, users are automatically redirected to an official payment receipt screen that can be shared or downloaded.

## Features

### Receipt Information
- **Receipt Number**: Auto-generated (RCP-XXXXX)
- **Date**: Current date
- **Student Details**: Name, ID, Class
- **Payment Details**: Month, Mode, Transaction ID
- **Fee Breakdown**: Individual fees if multiple paid
- **Total Amount**: Large, prominent display
- **Success Badge**: Visual confirmation

### Actions
1. **Share Receipt** - Share via WhatsApp, Email, SMS, etc.
2. **Download PDF** - Coming soon feature

## User Flow

1. Admin/Principal records payment in student profile
2. Clicks "Record Payment" button
3. Payment is saved to database
4. **Automatically redirected to receipt screen**
5. Can share or download receipt
6. Back button returns to student profile

## Design Elements

- Purple theme (#7C3AED) matching school branding
- Clean, professional layout
- School logo and contact info
- Grid layout for details
- Large green amount display
- Success badge with checkmark
- Thank you message at bottom

## Technical Details

**Route**: `/(dashboard)/payment-receipt`

**Parameters**: 
- `feeIds`: JSON array of paid fee IDs

**Data Source**: 
- Fetches fee and student data from Supabase
- Joins fees with students table

**Share Functionality**:
- Uses React Native Share API
- Formats receipt as plain text
- Works with all sharing apps

## Future Enhancements
- PDF generation and download
- Email receipt directly
- Print receipt
- Receipt history view
