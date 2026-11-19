import type { CheckoutDetails } from "@/lib/checkout";

export function AdminCustomerDetails({ customer }: { customer: CheckoutDetails }) {
  return <section>
    <h3>Contact &amp; delivery</h3>
    {customer.address ? <>
      <address><strong>{customer.fullName}</strong><br />
        {customer.address}<br />
        {customer.apartment && <>{customer.apartment}<br /></>}
        {customer.city}, {customer.state} {customer.pincode}<br />India
      </address>
      <p className="admin-contact">{customer.phone}{customer.email && <><br />{customer.email}</>}</p>
    </> : <p className="admin-muted">Contact and address were not provided for this older request. Ask the customer before confirming delivery.</p>}
  </section>;
}
