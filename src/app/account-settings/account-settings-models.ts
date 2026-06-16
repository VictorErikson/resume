export enum AccountVariableType {
  Color = 'color',
  Text = 'text',
  Image = 'image',
}

export interface AccountVariable {
  key: string;
  value: string;
  type: AccountVariableType;
}
