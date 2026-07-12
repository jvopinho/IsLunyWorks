import { WorkbookBuilder, ColumnConfig } from './WorkbookBuilder';

export interface SheetConfig {
  name: string;
  isSummary?: boolean;
  summaryItems?: { label: string; value: any }[];
  columns?: ColumnConfig[];
  data: any[];
}

export interface ExportOptions {
  title: string;
  responsibleName: string;
  period?: string;
  sheets: SheetConfig[];
}

export class ExcelExportService {
  /**
   * Generates a stylized .xlsx spreadsheet buffer based on the provided sheets configuration.
   *
   * @param options Workbook creation configurations.
   * @returns Promise<Buffer> file raw buffer.
   */
  static async exportToExcel(options: ExportOptions): Promise<Buffer> {
    const builder = new WorkbookBuilder();

    for (const sheetConfig of options.sheets) {
      if (sheetConfig.isSummary && sheetConfig.summaryItems) {
        builder.addSummarySheet(
          sheetConfig.name,
          options.title,
          options.responsibleName,
          sheetConfig.summaryItems,
          options.period
        );
      } else if (sheetConfig.columns) {
        builder.addDataSheet(
          sheetConfig.name,
          options.title,
          options.responsibleName,
          sheetConfig.columns,
          sheetConfig.data,
          options.period
        );
      }
    }

    return builder.toBuffer();
  }
}
