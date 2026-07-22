export interface OrderItemRow {
  product: string;
  quantity: number;
}

export function OrderItemsField({
  rows,
  onChange,
}: {
  rows: OrderItemRow[];
  onChange: (rows: OrderItemRow[]) => void;
}) {
  function update(i: number, patch: Partial<OrderItemRow>) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { product: '', quantity: 1 }]);
  }

  function removeAt(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            value={row.product}
            onChange={(e) => update(i, { product: e.target.value })}
            placeholder="Product ID (uuid)"
            className="flex-1 border border-line rounded-md px-3 py-1.5 text-sm font-mono focus:border-indigo transition-colors"
          />
          <input
            type="number"
            min={1}
            value={row.quantity}
            onChange={(e) => update(i, { quantity: Math.max(1, Number(e.target.value)) })}
            className="w-24 border border-line rounded-md px-3 py-1.5 text-sm font-mono focus:border-indigo transition-colors"
          />
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="text-slate-muted hover:text-red text-sm px-2 py-1.5"
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
        + Add item
      </button>
      {rows.length === 0 && (
        <p className="text-xs text-slate-muted">Add at least one product + quantity.</p>
      )}
    </div>
  );
}
