import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports an HTML element to a professional high-resolution A4 PDF.
 * @param {HTMLElement|string} target - The element or DOM element ID to export
 * @param {string} filename - The output PDF filename (e.g. 'Invoice-INV-2026-5854.pdf')
 * @returns {Promise<boolean>}
 */
export async function exportToA4Pdf(target, filename = 'ApexDental_Document.pdf') {
  try {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) {
      console.error('Target element not found for PDF export:', target);
      return false;
    }

    // High resolution canvas capture
    const canvas = await html2canvas(element, {
      scale: 2, // 2x DPI for crisp print quality
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Initialize A4 portrait PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const elementAspectRatio = canvas.height / canvas.width;
    const imgHeight = pdfWidth * elementAspectRatio;

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
    } else {
      // If content exceeds one page, fit scaled to single A4 page neatly
      const scaleFactor = pdfHeight / imgHeight;
      const scaledWidth = pdfWidth * scaleFactor;
      const xOffset = (pdfWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, pdfHeight);
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}
