import React, { useRef } from 'react';
import { Printer, Download, Upload } from 'lucide-react';
import Papa from 'papaparse';

const ActionButtons = ({ data, filename, onImport }) => {
  const fileInputRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }
    const csv = Papa.unparse(data);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 Arabic support
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          if (onImport) onImport(results.data);
          e.target.value = null; // Reset input
        }
      });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button className="btn" style={{ backgroundColor: '#4B5563', color: 'white' }} onClick={handlePrint}>
        <Printer size={16} /> طباعة
      </button>
      <button className="btn" style={{ backgroundColor: '#10B981', color: 'white' }} onClick={handleExport}>
        <Download size={16} /> تصدير
      </button>
      {onImport && (
        <>
          <input 
            type="file" 
            accept=".csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleImport} 
          />
          <button className="btn" style={{ backgroundColor: '#F59E0B', color: 'white' }} onClick={() => fileInputRef.current.click()}>
            <Upload size={16} /> استيراد
          </button>
        </>
      )}
    </div>
  );
};

export default ActionButtons;
