export function TagListField({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  function updateAt(i: number, v: string) {
    const next = [...values];
    next[i] = v;
    onChange(next);
  }

  function addRow() {
    onChange([...values, '']);
  }

  function removeAt(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={v}
            onChange={(e) => updateAt(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 border border-line rounded-md px-3 py-1.5 text-sm font-mono focus:border-indigo transition-colors"
          />
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="text-slate-muted hover:text-red text-sm px-2"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm font-medium text-indigo hover:underline"
      >
        + Add URL
      </button>
    </div>
  );
}
