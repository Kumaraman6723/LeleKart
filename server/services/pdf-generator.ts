/**
 * PDF Generator Service
 *
 * This file contains functions for generating PDF documents.
 */

import templateService from "./template-service";
import handlebars from "handlebars";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import { JSDOM } from "jsdom";
import htmlPdf from "html-pdf-node";

// Template types - export for use in other modules
export const TEMPLATES = {
  INVOICE: "invoice",
  RETURN_LABEL: "return-label",
  RETURN_FORM: "return-form",
  SHIPPING_LABEL: "shipping-label",
  PACKING_SLIP: "packing-slip",
  TAX_INVOICE: "tax-invoice",
};

// PDF generation options
const PDF_OPTIONS = {
  format: "A4",
  margin: {
    top: "10mm",
    right: "10mm",
    bottom: "10mm",
    left: "10mm",
  },
  printBackground: true,
  preferCSSPageSize: true,
};

/**
 * Generate a PDF document from a template
 * @param templateType Type of template to use
 * @param data Data to populate the template with
 */
export async function generatePdfBuffer(
  templateType: string,
  data: any
): Promise<Buffer> {
  try {
    // Get the template HTML
    const templateHtml = getPdfTemplate(templateType);

    // Render the template with data
    const html = await templateService.renderTemplate(templateHtml, data);

    // Generate PDF from HTML using html-pdf-node
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, PDF_OPTIONS);

    return pdfBuffer;
  } catch (error) {
    console.error("Error in PDF generation:", error);
    throw error;
  }
}

/**
 * Generate a PDF document and send it as a response
 * @param res Express response object
 * @param html HTML content to convert to PDF
 * @param filename Name to use for the downloaded file
 */
export async function generatePdf(
  res: any,
  html: string,
  filename: string
): Promise<void> {
  try {
    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Log the first 500 characters of the HTML to debug template issues
    console.log("Generating PDF with HTML content (first 500 chars):", html);

    // Generate PDF from HTML
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, PDF_OPTIONS);

    // Send PDF buffer directly
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error in PDF generation:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}

/**
 * Get the HTML for a template with data already applied
 * @param templateType Type of template to use
 * @param data Data to populate the template with
 * @returns HTML string with data applied to template
 */
export function getPdfTemplateHtml(templateType: string, data: any): string {
  try {
    // Get the template HTML
    const template = handlebars.compile(getPdfTemplate(templateType));

    // Apply the data to the template
    return template(data);
  } catch (error) {
    console.error(`Error generating template HTML for ${templateType}:`, error);
    return `<html><body><h1>Error generating template</h1><p>${error}</p></body></html>`;
  }
}

/**
 * Get the PDF template based on template type
 * @param templateType Type of template to get
 */
function getPdfTemplate(templateType: string): string {
  switch (templateType) {
    case TEMPLATES.INVOICE:
      return getInvoiceTemplate();
    case TEMPLATES.RETURN_LABEL:
      return getReturnLabelTemplate();
    case TEMPLATES.RETURN_FORM:
      return getReturnFormTemplate();
    case TEMPLATES.SHIPPING_LABEL:
      return getShippingLabelTemplate();
    case TEMPLATES.PACKING_SLIP:
      return getPackingSlipTemplate();
    case TEMPLATES.TAX_INVOICE:
      return getTaxInvoiceTemplate();
    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
}

/**
 * Get the invoice template
 */
function getInvoiceTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
          }
          .invoice-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .invoice-details-left, .invoice-details-right {
            width: 45%;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .invoice-table th, .invoice-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .invoice-table th {
            background-color: #f2f2f2;
          }
          .invoice-total {
            text-align: right;
            margin-top: 20px;
          }
          .invoice-total-row {
            margin-bottom: 5px;
          }
          .invoice-footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="invoice-title">INVOICE</div>
          <div>Invoice #{{order.orderNumber}}</div>
          <div>Date: {{order.createdAt}}</div>
        </div>
        
        <div class="invoice-details">
          <div class="invoice-details-left">
            <h3>From:</h3>
            <div>LeleKart Marketplace</div>
            <div>123 Commerce Street</div>
            <div>Mumbai, Maharashtra 400001</div>
            <div>India</div>
            <div>GSTIN: 27AABCU9603R1ZX</div>
          </div>
          <div class="invoice-details-right">
            <h3>To:</h3>
            <div>{{order.shippingAddress.name}}</div>
            <div>{{order.shippingAddress.address1}}</div>
            <div>{{order.shippingAddress.address2}}</div>
            <div>{{order.shippingAddress.city}}, {{order.shippingAddress.state}} {{order.shippingAddress.pincode}}</div>
            <div>{{order.shippingAddress.country}}</div>
          </div>
        </div>
        
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>GST Rate</th>
              <th>GST Amount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each order.orderItems}}
            <tr>
              <td>{{this.product.name}}</td>
              <td>{{this.product.description}}</td>
              <td>{{this.quantity}}</td>
              <td>₹{{this.price}}</td>
              <td>{{this.product.gstRate}}%</td>
              <td>₹{{this.gstAmount}}</td>
              <td>₹{{this.totalPrice}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        
        <div class="invoice-total">
          <div class="invoice-total-row">Subtotal: ₹{{order.subtotal}}</div>
          <div class="invoice-total-row">Shipping: ₹{{order.shippingFee}}</div>
          <div class="invoice-total-row">GST: ₹{{order.taxAmount}}</div>
          <div class="invoice-total-row">Discount: -₹{{order.discount}}</div>
          <div class="invoice-total-row"><strong>Total: ₹{{order.total}}</strong></div>
          {{#if order.wallet_discount}}
          <div class="invoice-total-row">Paid with Wallet: -₹{{order.wallet_discount}}</div>
          <div class="invoice-total-row"><strong>Balance Paid: ₹{{order.amountPaid}}</strong></div>
          {{/if}}
        </div>
        
        <div class="invoice-footer">
          <div>Thank you for shopping with LeleKart!</div>
          <div>For any questions regarding this invoice, please contact support@lelekart.com</div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get the return label template
 */
function getReturnLabelTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Return Label</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
          }
          .label {
            border: 2px solid #000;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
          }
          .label-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .label-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
          }
          .address-box {
            border: 1px solid #000;
            padding: 10px;
            margin-top: 5px;
          }
          .bold {
            font-weight: bold;
          }
          .barcode {
            text-align: center;
            margin: 20px 0;
          }
          .instructions {
            font-size: 12px;
            margin-top: 20px;
            padding: 10px;
            border: 1px dashed #ccc;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="label-header">
            <div class="label-title">RETURN SHIPPING LABEL</div>
            <div>Return #{{returnRequest.id}}</div>
          </div>
          
          <div class="section">
            <div class="bold">FROM:</div>
            <div class="address-box">
              {{returnRequest.buyerName}}<br>
              {{returnRequest.buyerAddress.address1}}<br>
              {{#if returnRequest.buyerAddress.address2}}{{returnRequest.buyerAddress.address2}}<br>{{/if}}
              {{returnRequest.buyerAddress.city}}, {{returnRequest.buyerAddress.state}} {{returnRequest.buyerAddress.pincode}}<br>
              {{returnRequest.buyerAddress.country}}
            </div>
          </div>
          
          <div class="section">
            <div class="bold">TO:</div>
            <div class="address-box">
              {{returnRequest.sellerName}}<br>
              {{returnRequest.sellerAddress.address1}}<br>
              {{#if returnRequest.sellerAddress.address2}}{{returnRequest.sellerAddress.address2}}<br>{{/if}}
              {{returnRequest.sellerAddress.city}}, {{returnRequest.sellerAddress.state}} {{returnRequest.sellerAddress.pincode}}<br>
              {{returnRequest.sellerAddress.country}}
            </div>
          </div>
          
          <div class="barcode">
            <!-- Barcode would be inserted here in a real implementation -->
            <div style="font-family: monospace; font-size: 16px;">*{{returnRequest.id}}*</div>
          </div>
          
          <div class="instructions">
            <div class="bold">Instructions:</div>
            <ol>
              <li>Print this label clearly on a plain white sheet of paper.</li>
              <li>Attach the label securely to your package.</li>
              <li>Drop off the package at your nearest courier service point.</li>
              <li>Keep the receipt as proof of return shipment.</li>
            </ol>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get the return form template
 */
function getReturnFormTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Return Form</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
          }
          .form {
            max-width: 700px;
            margin: 0 auto;
          }
          .form-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .form-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 5px;
            border-bottom: 1px solid #ddd;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .table th, .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .table th {
            background-color: #f2f2f2;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #777;
          }
          .signature {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .signature-line {
            width: 45%;
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="form">
          <div class="form-header">
            <div class="form-title">PRODUCT RETURN FORM</div>
            <div>Return #{{returnRequest.id}}</div>
            <div>Date: {{date}}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div>Name: {{returnRequest.buyerName}}</div>
            <div>Email: {{returnRequest.buyerEmail}}</div>
            <div>Phone: {{returnRequest.buyerPhone}}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Order Information</div>
            <div>Order #: {{returnRequest.orderNumber}}</div>
            <div>Order Date: {{returnRequest.orderDate}}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Product Information</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Return Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{returnRequest.productName}}</td>
                  <td>{{returnRequest.productSku}}</td>
                  <td>{{returnRequest.quantity}}</td>
                  <td>{{returnRequest.reasonText}}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Return Details</div>
            <div>Return Type: {{returnRequest.requestType}}</div>
            <div>Description: {{returnRequest.description}}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Instructions</div>
            <ol>
              <li>Please include this form with your return shipment.</li>
              <li>Pack the item(s) securely to prevent damage during transit.</li>
              <li>Use the provided return shipping label.</li>
              <li>Keep a copy of this form and shipping receipt for your records.</li>
            </ol>
          </div>
          
          <div class="signature">
            <div class="signature-line">Customer Signature</div>
            <div class="signature-line">Date</div>
          </div>
          
          <div class="footer">
            <div>LeleKart Return Department</div>
            <div>123 Commerce Street, Mumbai, Maharashtra 400001, India</div>
            <div>Email: returns@lelekart.com | Phone: +91-123-456-7890</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get the shipping label template
 */
export function getShippingLabelTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Shipping Label</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .shipping-label {
            border: 3px solid #000;
            padding: 20px;
            margin-bottom: 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 16px;
            margin-bottom: 10px;
          }
          .important {
            font-weight: bold;
            text-transform: uppercase;
          }
          .address-section {
            display: table;
            width: 100%;
            margin-bottom: 20px;
          }
          .address-box {
            display: table-cell;
            width: 50%;
            padding: 10px;
            vertical-align: top;
          }
          .address-box-inner {
            border: 1px solid #000;
            padding: 10px;
            min-height: 120px;
          }
          .address-label {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .barcode {
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #000;
            background: #f9f9f9;
          }
          .code {
            font-family: monospace;
            font-size: 18px;
            letter-spacing: 2px;
          }
          .footer {
            margin-top: 20px;
            font-size: 10px;
            text-align: center;
            color: #666;
          }
          .order-details {
            margin: 20px 0;
            border: 1px solid #ddd;
            padding: 10px;
            background: #f9f9f9;
          }
          .order-title {
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .delivery-date {
            margin-top: 10px;
            font-style: italic;
          }
          .note {
            font-size: 12px;
            margin-top: 20px;
            padding: 10px;
            border: 1px dashed #ccc;
            background: #f5f5f5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="shipping-label">
            <div class="header">
              <div class="title">Shipping Label</div>
              <div class="subtitle">LeleKart E-Commerce Platform</div>
              <div>Order #: {{mainOrder.id}}</div>
              <div>Date: {{currentDate}}</div>
            </div>
            
            <div class="address-section">
              <div class="address-box">
                <div class="address-label">FROM:</div>
                <div class="address-box-inner">
                  <strong>{{seller.username}}</strong><br>
                  {{#if businessDetails}}
                  {{businessDetails.businessName}}<br>
                  {{/if}}
                  LeleKart Fulfillment Center<br>
                  123 Commerce Street<br>
                  Mumbai, Maharashtra 400001<br>
                  India
                </div>
              </div>
              
              <div class="address-box">
                <div class="address-label">TO:</div>
                <div class="address-box-inner">
                  {{#if shippingAddress}}
                  <strong>{{shippingAddress.name}}</strong><br>
                  {{shippingAddress.address1}}{{#if shippingAddress.address2}}<br>{{shippingAddress.address2}}{{/if}}<br>
                  {{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.pincode}}<br>
                  {{shippingAddress.country}}<br>
                  Phone: {{shippingAddress.phone}}
                  {{else}}
                  {{#if mainOrder.shippingDetails}}
                  <strong>{{mainOrder.shippingDetails.name}}</strong><br>
                  {{mainOrder.shippingDetails.address}}<br>
                  {{mainOrder.shippingDetails.city}}, {{mainOrder.shippingDetails.state}} {{mainOrder.shippingDetails.zipCode}}<br>
                  India<br>
                  Phone: {{mainOrder.shippingDetails.phone}}
                  {{else}}
                  <strong>Customer Address</strong><br>
                  Address information not available
                  {{/if}}
                  {{/if}}
                </div>
              </div>
            </div>
            
            <div class="order-details">
              <div class="order-title">Order Information</div>
              <div>Order ID: {{mainOrder.id}}</div>
              <div>Order Date: {{mainOrder.formattedDate}}</div>
              <div>Status: {{mainOrder.formattedStatus}}</div>
              <div>Payment Method: {{mainOrder.paymentMethod}}</div>
              {{#if mainOrder.estimatedDeliveryDate}}
              <div class="delivery-date">Estimated Delivery: {{mainOrder.estimatedDeliveryDate}}</div>
              {{/if}}
            </div>
            
            <div class="barcode">
              <div>Scan for order tracking</div>
              <div class="code">*{{mainOrder.id}}*</div>
            </div>
            
            <div class="note">
              <div class="important">Important:</div>
              <ul>
                <li>Please keep this label with your package.</li>
                <li>This shipping label is required for delivery.</li>
                <li>For any questions, contact LeleKart customer service.</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <div>Generated by LeleKart E-Commerce Platform</div>
            <div>This document is system-generated and doesn't require a signature.</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get the packing slip template
 */
function getPackingSlipTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Packing Slip</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
          }
          .packing-slip {
            max-width: 700px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .address-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .address-box {
            width: 45%;
          }
          .address-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .table th, .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .table th {
            background-color: #f2f2f2;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="packing-slip">
          <div class="header">
            <div class="title">PACKING SLIP</div>
            <div>Order #{{order.orderNumber}}</div>
            <div>Date: {{order.createdAt}}</div>
          </div>
          
          <div class="address-section">
            <div class="address-box">
              <div class="address-title">Ship To:</div>
              <div>{{order.shippingAddress.name}}</div>
              <div>{{order.shippingAddress.address1}}</div>
              <div>{{order.shippingAddress.address2}}</div>
              <div>{{order.shippingAddress.city}}, {{order.shippingAddress.state}} {{order.shippingAddress.pincode}}</div>
              <div>{{order.shippingAddress.country}}</div>
              <div>Phone: {{order.shippingAddress.phone}}</div>
            </div>
            
            <div class="address-box">
              <div class="address-title">Order Information:</div>
              <div>Order Date: {{order.createdAt}}</div>
              <div>Payment Method: {{order.paymentMethod}}</div>
              <div>Shipping Method: {{order.shippingMethod}}</div>
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {{#each order.orderItems}}
              <tr>
                <td>{{this.product.name}}</td>
                <td>{{this.product.sku}}</td>
                <td>{{this.quantity}}</td>
                <td>₹{{this.price}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
          
          <div class="footer">
            <div>This is not a receipt. Thank you for shopping with LeleKart!</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get the tax invoice template
 */
/**
 * Get the tax invoice template from the filesystem or fallback to default
 */
function getTaxInvoiceTemplate(): string {
  try {
    // First try to load the template from the filesystem
    const template = fs.readFileSync(
      "flipkart_style_invoice_template.html",
      "utf8"
    );
    console.log("Using Flipkart-style tax invoice template from filesystem");
    return template;
  } catch (error) {
    // If file read fails, return the default template
    console.warn(
      "Flipkart-style template not found in filesystem, using default template"
    );

    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tax Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #333;
            margin: 0;
            padding: 10px;
          }
          .invoice-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ccc;
          }
          .header-logo {
            padding: 10px;
            border-bottom: 1px solid #ccc;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2874f0;
          }
          .header-title {
            background-color: #f0f0f0;
            text-align: center;
            padding: 8px;
            font-weight: bold;
            font-size: 16px;
            border-bottom: 1px solid #ccc;
          }
          .info-section {
            display: flex;
            width: 100%;
            border-bottom: 1px solid #ccc;
          }
          .left-column, .right-column {
            width: 50%;
            padding: 10px;
          }
          .right-column {
            border-left: 1px solid #ccc;
          }
          .info-label {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .address-block {
            margin-left: 0;
            margin-top: 5px;
            font-size: 11px;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          table, th, td {
            border: 1px solid #ccc;
          }
          th {
            background-color: #f5f5f5;
            text-align: center;
            padding: 8px 5px;
            font-weight: bold;
            font-size: 11px;
          }
          td {
            padding: 8px 5px;
            text-align: center;
            font-size: 11px;
          }
          .align-left {
            text-align: left;
          }
          .align-right {
            text-align: right;
          }
          .signature-section {
            margin-top: 30px;
            padding: 10px;
            font-size: 11px;
            text-align: right;
            border-top: 1px solid #ccc;
          }
          .taxes-column {
            max-width: 300px;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
            padding: 10px;
            font-size: 11px;
            border-top: 1px solid #ccc;
          }
          .totals-table {
            width: 300px;
            border: none;
          }
          .totals-table td {
            border: none;
            padding: 3px 5px;
          }
          .totals-table .total-label {
            text-align: right;
            font-weight: normal;
          }
          .totals-table .total-value {
            text-align: right;
            width: 100px;
          }
          .totals-table .grand-total {
            font-weight: bold;
            border-top: 1px solid #ccc;
          }
          .invoice-footer {
            padding: 10px;
            font-size: 10px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ccc;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header with Logo -->
          <div class="header-logo">
            <div class="logo">LeLeKart</div>
            <div style="text-align: right; font-size: 11px;">
              <div><strong>Order #:</strong> {{order.orderNumber}}</div>
              <div><strong>Order Date:</strong> {{order.orderDate}}</div>
            </div>
          </div>
          
          <!-- Invoice Header -->
          <div class="header-title">TAX INVOICE</div>
          
          <!-- Invoice Info Section -->
          <div class="info-section">
            <div class="left-column">
              <div class="info-label">SOLD BY:</div>
              <div class="address-block">
                {{order.sellerBusinessName}}<br>
                {{order.sellerAddress}}<br>
                GSTIN: {{order.sellerGstin}}
              </div>
              
              <div class="info-label" style="margin-top: 15px;">BILLING ADDRESS:</div>
              <div class="address-block">
                {{order.billingName}}<br>
                {{order.billingAddress}}
              </div>
            </div>
            <div class="right-column">
              <div class="info-label">INVOICE DETAILS:</div>
              <div class="address-block">
                <div><strong>Invoice Number:</strong> {{order.invoiceNumber}}</div>
                <div><strong>Invoice Date:</strong> {{order.invoiceDate}}</div>
                <div><strong>Place of Supply:</strong> {{order.state}}</div>
              </div>
              
              <div class="info-label" style="margin-top: 15px;">SHIPPING ADDRESS:</div>
              <div class="address-block">
                {{order.shippingName}}<br>
                {{order.shippingAddress}}
              </div>
            </div>
          </div>
          
          <!-- Invoice Table -->
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 8%;">HSN</th>
                <th style="width: 5%;">Qty</th>
                <th style="width: 8%;">Gross Amount</th>
                <th style="width: 8%;">Discount</th>
                <th style="width: 8%;">Taxable Value</th>
                <th style="width: 15%;">Tax Rate & Amount</th>
                <th style="width: 8%;">Total</th>
              </tr>
            </thead>
            <tbody>
              {{#each order.items}}
              <tr>
                <td>{{this.srNo}}</td>
                <td class="align-left">{{this.description}}</td>
                <td>{{this.hsn}}</td>
                <td>{{this.quantity}}</td>
                <td class="align-right">₹{{this.mrp}}</td>
                <td class="align-right">₹{{this.discount}}</td>
                <td class="align-right">₹{{this.taxableValue}}</td>
                <td class="align-left">
                  {{#each this.taxComponents}}
                  {{this.taxName}} @ {{this.taxRate}}%: ₹{{this.taxAmount}}<br>
                  {{/each}}
                </td>
                <td class="align-right">₹{{this.total}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
          
          <!-- Totals Section -->
          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td class="total-label">Total Gross Amount:</td>
                <td class="total-value">₹{{order.totalGrossAmount}}</td>
              </tr>
              <tr>
                <td class="total-label">Total Discount:</td>
                <td class="total-value">₹{{order.totalDiscount}}</td>
              </tr>
              <tr>
                <td class="total-label">Total Tax Value:</td>
                <td class="total-value">₹{{order.totalTaxAmount}}</td>
              </tr>
              <tr class="grand-total">
                <td class="total-label">Grand Total:</td>
                <td class="total-value">₹{{order.grandTotal}}</td>
              </tr>
            </table>
          </div>
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div style="margin-bottom: 40px;">For {{order.sellerBusinessName}}</div>
            <div class="info-label">Authorized Signatory</div>
          </div>
          
          <!-- Footer -->
          <div class="invoice-footer">
            This is a computer-generated invoice and does not require a physical signature.
          </div>
        </div>
      </body>
    </html>`;
  }
}
