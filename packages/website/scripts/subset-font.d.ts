declare module "subset-font" {
  interface AxisRange {
    min: number;
    max: number;
  }

  interface SubsetOptions {
    targetFormat?: "sfnt" | "woff" | "woff2";
    glyphNames?: boolean;
    variationAxes?: Record<string, number | AxisRange>;
  }

  const subsetFont: (font: Buffer, text: string, options?: SubsetOptions) => Promise<Buffer>;
  export default subsetFont;
}
