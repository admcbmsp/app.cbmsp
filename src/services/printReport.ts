export const openPrintReport = (html: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return false;
  }

  printWindow.addEventListener('load', () => {
    printWindow.focus();
    printWindow.print();
  }, { once: true });

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};
