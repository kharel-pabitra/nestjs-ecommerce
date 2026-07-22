export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'int'
  | 'uuid'
  | 'enum'
  | 'string-array'
  | 'order-items'
  | 'textarea';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  enumOptions?: string[];
  min?: number;
}
