import Link from "next/link";
import Logo from "../Logo";

export default function PrivacyPage() {
  return <main className="legal-page">
    <div className="legal-header"><header className="site-header"><Logo /><Link className="text-button" href="/">Back to home</Link></header></div>
    <article className="legal-content">
      <p className="eyebrow">Early-access document</p><h1>Privacy notice</h1><p className="updated">Working draft · November 14, 2026</p>
      <p className="draft-notice"><b>Before public launch:</b> this draft should be reviewed by counsel and updated with the operating entity, mailing address, contact email, service providers, and final retention periods.</p>
      <h2>What we collect</h2><p>When you join early access, we collect your name, email, collecting interests, consent choice, referral and campaign information, and a one-way technical fingerprint used to limit spam. If you register trade-in interest, we also collect the grader, estimated value range, timing, and card details you provide.</p>
      <h2>How we use it</h2><p>We use this information to operate the early-access list, understand which membership and trade-in features matter, contact you about Slab Supply, prevent abuse, and measure site performance. We do not use the form to accept payment or create a binding trade-in offer.</p>
      <h2>Analytics</h2><p>We record basic first-party events such as page views, form starts and completions, FAQ opens, referral sharing, and interest in featured cards. These events use a random browser session identifier and do not use third-party advertising cookies.</p>
      <h2>Storage and sharing</h2><p>Submissions are stored in the site’s hosted database. We do not sell personal information. We may share it with infrastructure and communications providers strictly to operate the service, subject to appropriate agreements.</p>
      <h2>Your choices</h2><p>You can unsubscribe from any update using the link in that message. Before launch, add a verified privacy contact here for access, correction, or deletion requests: <b>[privacy contact to be added]</b>.</p>
      <h2>Retention and changes</h2><p>Early-access data will be reviewed and deleted when it is no longer needed, subject to legal or fraud-prevention requirements. We may update this notice as the service and vendor set become final.</p>
    </article>
  </main>;
}
