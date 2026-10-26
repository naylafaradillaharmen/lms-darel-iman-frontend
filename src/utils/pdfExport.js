import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads an official PKBM Attendance PDF Report directly as a .pdf file.
 */
export const exportAttendancePDF = ({
  records = [],
  periodLabel = 'Bulan Ini (Oktober 2026)',
  statusFilterLabel = 'Semua Status',
  className = 'Kelas X Paket C — Umar bin Khattab',
  academicYear = '2026/2027 Ganjil',
  tutorName = 'Ustadz Ahmad Fauzi, Lc.',
  tutorNiy = 'NIY. 201809 045',
  directorName = 'Dr. Muhammad Ridwan, Lc., M.Pd.',
  directorNiy = 'NIY. 201208 001'
}) => {
  // Initialize PDF in Landscape A4 (297 x 210 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Top Decorative Brand Bar
  doc.setFillColor(6, 78, 59); // Emerald-900
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(217, 119, 6); // Gold accent
  doc.rect(0, 5, pageWidth, 1.2, 'F');

  // 2. Kop Surat / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70); // dei-emerald
  doc.text('YAYASAN DAR EL IMAN PADANG — PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM)', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // dark ink
  doc.text('DAFTAR REKAPITULASI PRESENSI KEHADIRAN KBM SANTRI', pageWidth / 2, 21, { align: 'center' });

  // Divider Line
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);
  doc.line(14, 25, pageWidth - 14, 25);

  // 3. Information Metadata Card
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  const col1X = 14;
  const col2X = 110;
  const col3X = 210;

  doc.text(`Rombel / Kelas: ${className}`, col1X, 31);
  doc.text(`Tahun Ajaran: ${academicYear}`, col1X, 36);

  doc.text(`Periode: ${periodLabel}`, col2X, 31);
  doc.text(`Filter Status: ${statusFilterLabel}`, col2X, 36);

  const printTimeStr = new Date().toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Waktu Cetak: ${printTimeStr} WIB`, col3X, 31);
  doc.text(`Total Data: ${records.length} Santri Terdata`, col3X, 36);

  // 4. Quick Attendance Summary Stats (Mini KPI)
  const totalHadir = records.filter(r => r.status === 'HADIR').length;
  const totalIzin = records.filter(r => r.status === 'IZIN').length;
  const totalSakit = records.filter(r => r.status === 'SAKIT').length;
  const totalAlpa = records.filter(r => r.status === 'ALPA').length;
  const pctHadir = records.length > 0 ? ((totalHadir / records.length) * 100).toFixed(1) : '0.0';

  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, 40, pageWidth - 28, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 24, 39);

  const kpiText = `Ringkasan:  Hadir: ${totalHadir} santri (${pctHadir}%)  |  Izin Resmi: ${totalIzin} santri  |  Sakit Berobat: ${totalSakit} santri  |  Alpa: ${totalAlpa} santri`;
  doc.text(kpiText, pageWidth / 2, 45.5, { align: 'center' });

  // 5. Table using autoTable
  const tableRows = records.map((item, idx) => [
    idx + 1,
    item.date || '-',
    item.nisn || '-',
    item.student_name || '-',
    item.subject_name || '-',
    item.time_recorded || '-',
    item.status || '-',
    item.notes || item.reason || '-'
  ]);

  autoTable(doc, {
    startY: 51,
    head: [[
      'No',
      'Tanggal',
      'NISN',
      'Nama Lengkap Santri',
      'Mata Pelajaran',
      'Waktu',
      'Status',
      'Catatan / Alasan'
    ]],
    body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'Tidak ada data presensi yang sesuai', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [6, 78, 59], // emerald
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
      3: { cellWidth: 50, fontStyle: 'bold' },
      4: { cellWidth: 44 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      7: { cellWidth: 'auto' }
    },
    didParseCell: (data) => {
      // Color status column cells
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw;
        if (val === 'HADIR') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald
          data.cell.styles.fillColor = [236, 253, 245];
        } else if (val === 'IZIN') {
          data.cell.styles.textColor = [217, 119, 6]; // amber
          data.cell.styles.fillColor = [254, 243, 199];
        } else if (val === 'SAKIT') {
          data.cell.styles.textColor = [37, 99, 235]; // blue
          data.cell.styles.fillColor = [239, 246, 255];
        } else if (val === 'ALPA') {
          data.cell.styles.textColor = [220, 38, 38]; // red
          data.cell.styles.fillColor = [254, 242, 242];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 42 }
  });

  // 6. Signature Block on Last Page
  const finalY = doc.lastAutoTable.finalY + 8;
  const sigY = Math.min(finalY > pageHeight - 40 ? pageHeight - 38 : finalY, pageHeight - 38);

  // Avoid signature overlapping table
  if (finalY > pageHeight - 35) {
    doc.addPage();
  }

  const signBaseY = finalY > pageHeight - 35 ? 20 : sigY;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);

  // Left Signature: Direktur PKBM
  doc.text('Mengetahui,', 30, signBaseY);
  doc.setFont('helvetica', 'bold');
  doc.text('Direktur PKBM Digital Dar El Iman', 30, signBaseY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(directorName, 30, signBaseY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text(directorNiy, 30, signBaseY + 26);

  // Right Signature: Tutor Pengampu
  const rightSignX = pageWidth - 70;
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);
  doc.text('Padang, 18 Oktober 2026', rightSignX, signBaseY);
  doc.setFont('helvetica', 'bold');
  doc.text('Tutor / Ustadz Pengampu KBM', rightSignX, signBaseY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(tutorName, rightSignX, signBaseY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text(tutorNiy, rightSignX, signBaseY + 26);

  // 7. Footer Official Stamp & Page Info on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 8, pageWidth - 14, pageHeight - 8);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text(
      'Dokumen resmi ini di-generate otomatis oleh PKBM Digital Dar El Iman • Sah tanpa tanda tangan basah jika ber-QR/stempel digital.',
      14,
      pageHeight - 4.5
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 4.5, { align: 'right' });
  }

  // 8. Download directly as a .pdf file!
  const sanitizedPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Rekapitulasi_Presensi_PKBM_${sanitizedPeriod}.pdf`;
  doc.save(fileName);

  return fileName;
};
