declare module "html-pdf-node" {
  interface PdfOptions {
    format?: string;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    printBackground?: boolean;
    preferCSSPageSize?: boolean;
  }

  interface FileOptions {
    content: string;
    url?: string;
  }

  function generatePdf(
    file: FileOptions,
    options?: PdfOptions
  ): Promise<Buffer>;

  export = {
    generatePdf,
  };
}
