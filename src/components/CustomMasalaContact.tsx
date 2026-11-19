"use client";

import { INDIAN_STATES, type CheckoutDetails, type CheckoutErrors } from "@/lib/checkout";

const fields = [
  { key: "fullName", label: "Full name", complete: "name", max: 100 },
  { key: "phone", label: "Mobile number", complete: "tel-national", max: 20 },
  { key: "email", label: "Email address (optional)", complete: "email", max: 254 },
  { key: "address", label: "House number & street", complete: "address-line1", max: 200 },
  { key: "apartment", label: "Apartment / landmark (optional)", complete: "address-line2", max: 100 },
  { key: "city", label: "City", complete: "address-level2", max: 100 },
  { key: "pincode", label: "PIN code", complete: "postal-code", max: 6 },
] as const;

export function CustomMasalaContact({ customer, errors, disabled, onChange }: {
  customer: CheckoutDetails; errors: CheckoutErrors; disabled: boolean;
  onChange: (key: keyof CheckoutDetails, value: string) => void;
}) {
  return <fieldset className="custom-masala-contact" disabled={disabled}>
    <legend>Contact &amp; delivery address</legend>
    <p>Your details are saved with this request for the owner. WhatsApp shares the recipe only; it does not include your address.</p>
    <div className="custom-masala-contact-fields">
      {fields.map(({ key, label, complete, max }) => <div key={key}>
        <label htmlFor={`masala-customer-${key}`}>{label}</label>
        <input id={`masala-customer-${key}`} name={key} autoComplete={complete} maxLength={max}
          type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
          inputMode={key === "pincode" ? "numeric" : undefined} value={customer[key]}
          aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `masala-customer-${key}-error` : undefined}
          onChange={(event) => onChange(key, event.target.value)} />
        {errors[key] && <p id={`masala-customer-${key}-error`} className="custom-masala-error">{errors[key]}</p>}
      </div>)}
      <div>
        <label htmlFor="masala-customer-state">State / union territory</label>
        <select id="masala-customer-state" value={customer.state} autoComplete="address-level1"
          aria-invalid={Boolean(errors.state)} aria-describedby={errors.state ? "masala-customer-state-error" : undefined}
          onChange={(event) => onChange("state", event.target.value)}>
          <option value="">Select a state</option>
          {INDIAN_STATES.map((state) => <option key={state}>{state}</option>)}
        </select>
        {errors.state && <p id="masala-customer-state-error" className="custom-masala-error">{errors.state}</p>}
      </div>
    </div>
  </fieldset>;
}
