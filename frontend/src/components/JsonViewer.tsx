export function JsonViewer({ data }: { data: unknown }) {
  const text = data === undefined ? '' : JSON.stringify(data, null, 2);
  return (
    <pre className="font-mono text-xs leading-relaxed bg-ink text-paper rounded-md p-4 overflow-auto max-h-96 whitespace-pre-wrap break-words">
      {text || '—'}
    </pre>
  );
}
