import type { ComponentProps } from 'react';
import { useController } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Checkbox } from '@/components/ui/Checkbox';
import { DateFields } from '@/components/ui/DateFields';
import { TimeFields } from '@/components/ui/TimeFields';
import { TextField } from '@/components/ui/TextField';

type Base<T extends FieldValues, O> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<T, any, O>;
  name: Path<T>;
};

type TextFieldProps = Omit<
  ComponentProps<typeof TextField>,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'
>;

/** TextField conectado a react-hook-form: valor, blur y error automaticos. */
export function FormTextField<T extends FieldValues, O = T>({
  control,
  name,
  ...rest
}: Base<T, O> & TextFieldProps) {
  const { field, fieldState } = useController({ control, name });
  return (
    <TextField
      {...rest}
      ref={field.ref}
      value={(field.value as string | undefined) ?? ''}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  );
}

export function FormDateField<T extends FieldValues, O = T>({
  control,
  name,
  label,
  helper,
}: Base<T, O> & { label: string; helper?: string }) {
  const { field, fieldState } = useController({ control, name });
  return (
    <DateFields
      label={label}
      helper={helper}
      value={(field.value as string | undefined) ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  );
}

export function FormCheckbox<T extends FieldValues, O = T>({
  control,
  name,
  label,
}: Base<T, O> & { label: string }) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Checkbox
      label={label}
      checked={field.value === true}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

export function FormTimeField<T extends FieldValues, O = T>({
  control,
  name,
  label,
  helper,
}: Base<T, O> & { label: string; helper?: string }) {
  const { field, fieldState } = useController({ control, name });
  return (
    <TimeFields
      label={label}
      helper={helper}
      value={(field.value as string | undefined) ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  );
}
