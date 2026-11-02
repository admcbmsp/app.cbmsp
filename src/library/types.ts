import { ReactNode } from 'react';

export type FieldMetaProps = {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  id?: string;
  fieldClassName?: string;
};
