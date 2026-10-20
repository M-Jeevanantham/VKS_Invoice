import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Invoice } from '../types';

/**
 * Exports an invoice element directly to a standard A4 portrait PDF file.
 * 
 * Uses explicit MIME type and data URL streaming with attached anchor element
 * to guarantee that modern Chromium (Chrome / Edge) downloads the file with the
 * explicit `.pdf` extension and human-readable invoice name, rather than falling
 * back to an unnamed raw blob UUID.
 */
export async function exportInvoiceToPdf(
  invoice: Invoice,
  preferredElement?: HTMLElement | null
): Promise<string> {
  // 1. Locate the active or off-screen invoice print layout element
  let targetElement: HTMLElement | null = preferredElement || null;

  if (!targetElement) {
    const printRoots = Array.from(document.querySelectorAll<HTMLElement>('#invoice-print-root'));
    // Prioritize an on-screen / visible print root first (e.g. inside open modal)
    const visibleRoot = printRoots.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.left >= 0 && rect.top >= 0;
    });

    targetElement = visibleRoot || printRoots[0] || null;
  }

  if (!targetElement) {
    throw new Error('Invoice print template element could not be found in DOM.');
  }

  // 2. Measure dimensions precisely to match 1:1 with element's natural A4 bounds
  const targetWidth = targetElement.offsetWidth || 794;
  const targetHeight = targetElement.offsetHeight || 1123;

  // Render high-resolution canvas at 2x scale for sharp text & vector crispness
  const canvas = await html2canvas(targetElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: targetWidth,
    height: targetHeight,
    windowWidth: targetWidth,
    windowHeight: targetHeight,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
  });

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('Canvas rendering produced zero-dimension output.');
  }

  // 3. Initialize jsPDF in standard A4 portrait mode (210mm x 297mm)
  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Add the invoice image fitted precisely within A4 boundaries
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));

  // 4. Construct human-readable, safe filename strictly ending with .pdf
  let rawNum = invoice.invoice_number;
  if (!rawNum) {
    const dcPart = invoice.dc_number ? `_DC_${invoice.dc_number.replace(/^#/, '')}` : '';
    rawNum = `DRAFT_INVOICE${dcPart}`;
  }
  const cleanNum = rawNum.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanNum}_VKS_BILL.pdf`;

  // 5. Generate explicit application/pdf Blob and typed File object
  const rawBlob = pdf.output('blob');
  const explicitPdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
  const fileObject = new File([explicitPdfBlob], fileName, { type: 'application/pdf' });

  // 6. Execute direct download with FileReader Data URL
  // Chromium (Chrome/Edge 120+) strictly preserves filename and .pdf extension
  // on Data URLs with body-attached anchors, avoiding the blob UUID rename bug.
  return new Promise<string>((resolve) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const dataUrl = reader.result as string;
          const downloadAnchor = document.createElement('a');
          downloadAnchor.style.position = 'fixed';
          downloadAnchor.style.left = '-9999px';
          downloadAnchor.style.top = '-9999px';
          downloadAnchor.href = dataUrl;
          downloadAnchor.download = fileName;
          downloadAnchor.setAttribute('download', fileName);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();

          setTimeout(() => {
            if (downloadAnchor.parentNode) {
              downloadAnchor.parentNode.removeChild(downloadAnchor);
            }
          }, 2000);

          resolve(fileName);
        } catch {
          fallbackBlobDownload(fileObject, fileName);
          resolve(fileName);
        }
      };

      reader.onerror = () => {
        fallbackBlobDownload(fileObject, fileName);
        resolve(fileName);
      };

      reader.readAsDataURL(explicitPdfBlob);
    } catch {
      fallbackBlobDownload(fileObject, fileName);
      resolve(fileName);
    }
  });
}

function fallbackBlobDownload(fileOrBlob: Blob | File, fileName: string) {
  const blobUrl = window.URL.createObjectURL(fileOrBlob);
  const anchor = document.createElement('a');
  anchor.style.position = 'fixed';
  anchor.style.left = '-9999px';
  anchor.style.top = '-9999px';
  anchor.href = blobUrl;
  anchor.download = fileName;
  anchor.setAttribute('download', fileName);
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    window.URL.revokeObjectURL(blobUrl);
  }, 10000);
}
