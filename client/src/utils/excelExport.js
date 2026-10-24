/**
 * Utility for exporting structured tabular data and reports to Excel / CSV format.
 */

export function exportToCsv(filename, headers, rows) {
  try {
    const csvContent = [];

    // Header row
    if (headers && headers.length > 0) {
      csvContent.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
    }

    // Data rows
    (rows || []).forEach(row => {
      if (Array.isArray(row)) {
        csvContent.push(row.map(cell => `"${String(cell !== undefined && cell !== null ? cell : '').replace(/"/g, '""')}"`).join(','));
      } else if (typeof row === 'string') {
        csvContent.push(row);
      }
    });

    const blob = new Blob(['\uFEFF' + csvContent.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Error exporting to CSV:', err);
    return false;
  }
}
