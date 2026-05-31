import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — frendr",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-20">

        <h1 className="display-sm text-core-black mb-2">Privacy Policy</h1>
        <p className="font-sans text-sm text-foreground/40 mb-12">Last updated: May 2026</p>

        <div className="prose-frendr">

          <section className="mb-10">
            <h2>1. Introduction</h2>
            <p>
              Frendr Co. ("we," "us," or "our") operates the Frendr platform. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal data. By using Frendr, you agree to the practices described here.
            </p>
          </section>

          <section className="mb-10">
            <h2>2. Information We Collect</h2>
            <p><strong>Account information:</strong> When you sign up, we collect your name, email address, and profile details you choose to provide (username, bio, location, website, social links, skills).</p>
            <p className="mt-4"><strong>Content:</strong> Videos, thumbnails, and any other content you upload to the Platform.</p>
            <p className="mt-4"><strong>Usage data:</strong> Information about how you interact with the Platform, including pages visited, videos watched, and actions taken. This helps us improve the experience.</p>
            <p className="mt-4"><strong>Device &amp; technical data:</strong> IP address, browser type, operating system, and referring URLs collected automatically when you use the Platform.</p>
          </section>

          <section className="mb-10">
            <h2>3. How We Use Your Information</h2>
            <ul className="space-y-1.5">
              <li>To provide, maintain, and improve the Platform</li>
              <li>To personalise your experience and surface relevant content</li>
              <li>To communicate with you about your account and Platform updates</li>
              <li>To detect and prevent fraud, abuse, and security incidents</li>
              <li>To comply with our legal obligations</li>
            </ul>
            <p className="mt-4">We do not sell your personal data to third parties.</p>
          </section>

          <section className="mb-10">
            <h2>4. Third-Party Services</h2>
            <p>We use the following third-party services to operate the Platform. Each has its own privacy policy governing how they handle data:</p>
            <ul className="mt-3 space-y-2">
              <li><strong>Clerk</strong> — user authentication and account management</li>
              <li><strong>Cloudflare Stream</strong> — video hosting and delivery</li>
              <li><strong>Algolia</strong> — search functionality</li>
              <li><strong>Amazon Web Services (S3)</strong> — file and image storage</li>
              <li><strong>Vercel</strong> — platform hosting and infrastructure</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2>5. Cookies</h2>
            <p>
              We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how the Platform is used. You can control cookies through your browser settings, though some features may not function correctly if cookies are disabled.
            </p>
          </section>

          <section className="mb-10">
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide the service. If you delete your account, we will delete or anonymise your personal data within 30 days, except where we are required by law to retain it.
            </p>
          </section>

          <section className="mb-10">
            <h2>7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="mt-3 space-y-1.5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict how we process your data</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:ryan@frendr.co" className="text-core-black underline hover:text-spring-green transition-colors">
                ryan@frendr.co
              </a>.
            </p>
          </section>

          <section className="mb-10">
            <h2>8. Security</h2>
            <p>
              We take reasonable technical and organisational measures to protect your personal data against unauthorised access, loss, or misuse. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-10">
            <h2>9. Children's Privacy</h2>
            <p>
              Frendr is not intended for children under 16. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
            </p>
          </section>

          <section className="mb-10">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting a notice on the Platform or by email. Your continued use of Frendr after changes take effect constitutes your acceptance of the revised Policy.
            </p>
          </section>

          <section className="mb-10">
            <h2>11. Contact</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please reach out at{" "}
              <a href="mailto:ryan@frendr.co" className="text-core-black underline hover:text-spring-green transition-colors">
                ryan@frendr.co
              </a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
