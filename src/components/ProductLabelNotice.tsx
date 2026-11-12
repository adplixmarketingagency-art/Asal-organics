import { foodLabelReview } from "@/content/food-labels";

/** A pending notice is not a substitute for the declarations required before sale. */
export function ProductLabelNotice() {
  return <div className="preview-notice product-label-notice">
    <strong>Product label information</strong>
    <p>{foodLabelReview.notice}</p>
    <details>
      <summary>What is pending?</summary>
      <p>{foodLabelReview.pendingDetails}</p>
      <p>{foodLabelReview.imageNotice}</p>
    </details>
  </div>;
}
