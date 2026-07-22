import type { FieldDef } from '../data/fieldTypes';
import { TagListField } from './TagListField';
import { OrderItemsField, type OrderItemRow } from './OrderItemsField';

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = (
    <label className="block text-xs font-medium uppercase tracking-wide text-slate-muted mb-1.5">
      {field.label}
      {field.required && <span className="text-red ml-1">*</span>}
      {field.helpText && (
        <span className="normal-case font-normal text-slate-muted/70"> — {field.helpText}</span>
      )}
    </label>
  );

  if (field.type === 'string-array') {
    return (
      <div>
        {label}
        <TagListField
          values={(value as string[]) ?? []}
          onChange={onChange}
          placeholder="https://…"
        />
      </div>
    );
  }

  if (field.type === 'order-items') {
    return (
      <div>
        {label}
        <OrderItemsField
          rows={(value as OrderItemRow[]) ?? []}
          onChange={onChange}
        />
      </div>
    );
  }

  if (field.type === 'enum') {
    return (
      <div>
        {label}
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-line rounded-md px-3 py-2 text-sm bg-panel focus:border-indigo transition-colors"
        >
          <option value="">— none —</option>
          {field.enumOptions?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        {label}
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full border border-line rounded-md px-3 py-2 text-sm focus:border-indigo transition-colors"
        />
      </div>
    );
  }

  const inputType =
    field.type === 'password'
      ? 'password'
      : field.type === 'email'
        ? 'email'
        : field.type === 'number' || field.type === 'int'
          ? 'number'
          : 'text';

  return (
    <div>
      {label}
      <input
        type={inputType}
        step={field.type === 'number' ? '0.01' : undefined}
        min={field.min}
        value={(value as string | number) ?? ''}
        onChange={(e) =>
          onChange(
            field.type === 'number' || field.type === 'int'
              ? e.target.value
              : e.target.value,
          )
        }
        placeholder={field.placeholder ?? (field.type === 'uuid' ? 'uuid' : undefined)}
        className={`w-full border border-line rounded-md px-3 py-2 text-sm bg-panel focus:border-indigo transition-colors ${
          field.type === 'uuid' ? 'font-mono' : ''
        }`}
      />
    </div>
  );
}
