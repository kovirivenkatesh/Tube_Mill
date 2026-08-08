export default function DynamicReportFields({ fields, values, onChange, readOnlyBlocks = [] }) {
  return (
    <>
      {readOnlyBlocks.map((block) => (
        <div className="field" key={block.id}>
          <label htmlFor={block.id}>{block.label}</label>
          <input id={block.id} value={block.value} readOnly />
        </div>
      ))}
      {fields.map((field) => {
        const id = `field-${field.fieldKey}`;
        const value = values[field.fieldKey] ?? "";
        const common = {
          id,
          value,
          required: field.required,
          placeholder: field.placeholder || undefined,
          onChange: (e) =>
            onChange(field.fieldKey, field.type === "number" ? e.target.value : e.target.value),
        };
        return (
          <div className="field" key={field.id || field.fieldKey}>
            <label htmlFor={id}>
              {field.label}
              {field.required ? "" : " (optional)"}
            </label>
            {field.type === "select" ? (
              <select
                id={id}
                value={value}
                required={field.required}
                onChange={(e) => onChange(field.fieldKey, e.target.value)}
              >
                <option value="">
                  {field.placeholder?.trim() || `Select ${field.label.toLowerCase()}…`}
                </option>
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea {...common} rows={4} />
            ) : (
              <input
                {...common}
                type={
                  field.type === "number" ? "number" : field.type === "email" ? "email" : "text"
                }
              />
            )}
          </div>
        );
      })}
    </>
  );
}
