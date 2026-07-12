import ExcelJS from 'exceljs';

export interface ColumnConfig {
  header: string;
  key: string;
  width?: number;
  numFmt?: string;
}

export class WorkbookBuilder {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'IsLuny Works';
    this.workbook.lastModifiedBy = 'IsLuny Works';
  }

  addSummarySheet(
    name: string,
    title: string,
    responsibleName: string,
    summaryItems: { label: string; value: any }[],
    period?: string
  ) {
    const sheet = this.workbook.addWorksheet(name, {
      views: [{ showGridLines: true }],
    });

    // 1. Brand Header
    sheet.mergeCells('A1:C1');
    const brandCell = sheet.getCell('A1');
    brandCell.value = '❄️ IsLuny Org - IsLuny Works';
    brandCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    brandCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' },
    };
    brandCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 35;

    // 2. Metadata Block
    sheet.mergeCells('A2:C2');
    const titleCell = sheet.getCell('A2');
    titleCell.value = title;
    titleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle' };
    sheet.getRow(2).height = 25;

    sheet.getCell('A3').value = 'Exportado por:';
    sheet.getCell('A3').font = { name: 'Segoe UI', size: 10, bold: true };
    sheet.getCell('B3').value = responsibleName;
    sheet.getCell('B3').font = { name: 'Segoe UI', size: 10 };

    sheet.getCell('A4').value = 'Data de Geração:';
    sheet.getCell('A4').font = { name: 'Segoe UI', size: 10, bold: true };
    sheet.getCell('B4').value = new Date().toLocaleString('pt-BR');
    sheet.getCell('B4').font = { name: 'Segoe UI', size: 10 };

    if (period) {
      sheet.getCell('A5').value = 'Período:';
      sheet.getCell('A5').font = { name: 'Segoe UI', size: 10, bold: true };
      sheet.getCell('B5').value = period;
      sheet.getCell('B5').font = { name: 'Segoe UI', size: 10 };
    }

    // 3. Summary Content
    const startRowIdx = 7;
    sheet.getCell(`A${startRowIdx}`).value = 'Indicador';
    sheet.getCell(`B${startRowIdx}`).value = 'Valor';
    
    const headerRow = sheet.getRow(startRowIdx);
    headerRow.height = 25;
    headerRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

    ['A', 'B'].forEach((col) => {
      const cell = sheet.getCell(`${col}${startRowIdx}`);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      };
      cell.alignment = { vertical: 'middle' };
    });

    let currentIdx = startRowIdx;
    summaryItems.forEach((item) => {
      currentIdx++;
      const row = sheet.getRow(currentIdx);
      row.height = 20;

      const labelCell = sheet.getCell(`A${currentIdx}`);
      labelCell.value = item.label;
      labelCell.font = { name: 'Segoe UI', size: 10, bold: true };
      labelCell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };

      const valueCell = sheet.getCell(`B${currentIdx}`);
      valueCell.value = item.value;
      valueCell.font = { name: 'Segoe UI', size: 10 };
      valueCell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });

    // Auto-fit column widths
    sheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        maxLen = Math.max(maxLen, valStr.length);
      });
      column.width = Math.max(18, maxLen + 3);
    });

    return sheet;
  }

  addDataSheet(
    name: string,
    title: string,
    responsibleName: string,
    columns: ColumnConfig[],
    data: any[],
    period?: string
  ) {
    const sheet = this.workbook.addWorksheet(name, {
      views: [{ state: 'frozen', ySplit: 7, showGridLines: true }],
    });

    const colCount = Math.max(3, columns.length);
    const lastColLetter = String.fromCharCode(65 + colCount - 1);

    // Initial column keys mapping (sets keys for referencing cells)
    sheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
      style: col.numFmt ? { numFmt: col.numFmt } : undefined,
    }));

    // 1. Brand Header
    sheet.mergeCells(`A1:${lastColLetter}1`);
    const brandCell = sheet.getCell('A1');
    brandCell.value = '❄️ IsLuny Org - IsLuny Works';
    brandCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    brandCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' },
    };
    brandCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 35;

    // 2. Metadata Block
    sheet.mergeCells(`A2:${lastColLetter}2`);
    const titleCell = sheet.getCell('A2');
    titleCell.value = title;
    titleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle' };
    sheet.getRow(2).height = 25;

    sheet.getCell('A3').value = 'Exportado por:';
    sheet.getCell('A3').font = { name: 'Segoe UI', size: 10, bold: true };
    sheet.getCell('B3').value = responsibleName;
    sheet.getCell('B3').font = { name: 'Segoe UI', size: 10 };

    sheet.getCell('A4').value = 'Data de Geração:';
    sheet.getCell('A4').font = { name: 'Segoe UI', size: 10, bold: true };
    sheet.getCell('B4').value = new Date().toLocaleString('pt-BR');
    sheet.getCell('B4').font = { name: 'Segoe UI', size: 10 };

    if (period) {
      sheet.getCell('A5').value = 'Período:';
      sheet.getCell('A5').font = { name: 'Segoe UI', size: 10, bold: true };
      sheet.getCell('B5').value = period;
      sheet.getCell('B5').font = { name: 'Segoe UI', size: 10 };
    }

    // 3. Table Column Headers
    const headerRowIdx = 7;
    const headerRow = sheet.getRow(headerRowIdx);
    headerRow.height = 25;
    
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF312E81' } },
      };
    });

    // 4. Fill Data
    data.forEach((rowData) => {
      const row = sheet.addRow(rowData);
      row.height = 20;
      row.font = { name: 'Segoe UI', size: 10 };
      
      row.eachCell((cell) => {
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        cell.alignment = { vertical: 'middle' };
      });
    });

    // Enable Autofilters
    sheet.autoFilter = {
      from: `A${headerRowIdx}`,
      to: `${lastColLetter}${headerRowIdx}`,
    };

    // Auto-fit Column Widths
    sheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber < headerRowIdx) return;
        const valStr = cell.value ? String(cell.value) : '';
        maxLen = Math.max(maxLen, valStr.length);
      });
      column.width = Math.max(14, maxLen + 3);
    });

    return sheet;
  }

  async toBuffer(): Promise<Buffer> {
    const buffer = await this.workbook.xlsx.writeBuffer() as ArrayBuffer;
    return Buffer.from(buffer);
  }
}
