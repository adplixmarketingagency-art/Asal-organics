"use client";

import { INDIAN_STATES, type CheckoutDetails, type CheckoutErrors } from "@/lib/checkout";

const fields: { key: keyof CheckoutDetails; label: string; autoComplete: string; type?: string; wide?: boolean; maxLength: number; optional?: boolean }[] = [
  { key: "fullName", label: "Full name", autoComplete: "name", wide: true, maxLength: 100 },
  { key: "email", label: "Email address", autoComplete: "email", type: "email", maxLength: 254 },
  { key: "phone", label: "Mobile number", autoComplete: "tel-national", type: "tel", maxLength: 20 },
  { key: "address", label: "House number & street", autoComplete: "address-line1", wide: true, maxLength: 200 },
  { key: "apartment", label: "Apartment, landmark, etc.", autoComplete: "address-line2", wide: true, maxLength: 100, optional: true },
  { key: "city", label: "City", autoComplete: "address-level2", maxLength: 100 },
  { key: "pincode", label: "PIN code", autoComplete: "postal-code", maxLength: 6 },
];

export function CheckoutContactFields({ details, errors, onChange, emailOptional = false }: {
  details: CheckoutDetails; errors: CheckoutErrors; emailOptional?: boolean;
  onChange: (key: keyof CheckoutDetails, value: string) => void;
}) {
  return <div className="checkout-fields">
    {fields.map(({ key, label, autoComplete, type = "text", wide, maxLength, optional: defaultOptional }) => {
      const optional = defaultOptional || (key === "email" && emailOptional);
      return <div key={key} className={`checkout-field ${wide ? "field-wide" : ""}`}>
        <label htmlFor={`checkout-${key}`}>{label}{optional && <span> (optional)</span>}</label>
        <input id={`checkout-${key}`} name={key} type={type} autoComplete={autoComplete} maxLength={maxLength} required={!optional}
          inputMode={key === "pincode" ? "numeric" : undefined} value={details[key]}
          onChange={(event) => onChange(key, event.target.value)} aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `${key}-error` : key === "phone" ? "phone-hint" : undefined} />
        {key === "phone" && !errors.phone && <small id="phone-hint">Indian mobile number, with or without +91.</small>}
        {errors[key] && <p className="field-error" id={`${key}-error`}>{errors[key]}</p>}
      </div>;
    })}
    <div className="checkout-field">
      <label htmlFor="checkout-state">State / union territory</label>
      <select id="checkout-state" name="state" autoComplete="address-level1" value={details.state}
        onChange={(event) => onChange("state", event.target.value)} required aria-invalid={Boolean(errors.state)}
        aria-describedby={errors.state ? "state-error" : undefined}>
        <option value="">Select a state</option>{INDIAN_STATES.map((state) => <option key={state}>{state}</option>)}
      </select>
      {errors.state && <p className="field-error" id="state-error">{errors.state}</p>}
    </div>
    <div className="checkout-field"><label htmlFor="checkout-country">Country</label><input id="checkout-country" name="country" value="India" readOnly /></div>
  </div>;
}
