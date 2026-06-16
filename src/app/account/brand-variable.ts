export interface BrandVariableSection {
  [key: string]: string | undefined;
}

export interface BrandVariable {
  canvas: BrandVariableSection;
  button: BrandVariableSection;
  text: BrandVariableSection;
  headline: BrandVariableSection;
  label: BrandVariableSection;
  input: BrandVariableSection;
}
