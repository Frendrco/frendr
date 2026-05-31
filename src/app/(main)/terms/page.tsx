import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service — frendr",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-20">

        <h1 className="display-sm text-core-black mb-2">Terms of Service</h1>
        <p className="font-sans text-sm text-foreground/40 mb-12">Last updated: May 2026</p>

        <div className="prose-frendr">

          <section className="mb-10">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Frendr ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. Frendr is operated by Frendr Co. ("we," "us," or "our").
            </p>
          </section>

          <section className="mb-10">
            <h2>2. What Frendr Is</h2>
            <p>
              Frendr is a creative video platform built for motion designers, animators, and video creators to share, discover, and celebrate their work. We provide tools to upload and showcase video content, follow other creators, and build a professional presence in the creative community.
            </p>
          </section>

          <section className="mb-10">
            <h2>3. Your Account</h2>
            <p>
              To upload content or engage with the community, you must create an account. You are responsible for keeping your account credentials secure and for all activity that occurs under your account. You must be at least 16 years old to use Frendr.
            </p>
          </section>

          <section className="mb-10">
            <h2>4. Content You Upload</h2>
            <p>
              You retain ownership of all content you upload to Frendr. By uploading content, you grant us a non-exclusive, royalty-free, worldwide licence to host, display, and distribute your content on the Platform for the purpose of operating the service.
            </p>
            <p className="mt-4">
              You are solely responsible for the content you upload. You must not upload content that:
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>Infringes on the intellectual property rights of others</li>
              <li>Contains nudity, violence, or otherwise offensive material</li>
              <li>Harasses, threatens, or demeans other users</li>
              <li>Is deceptive, fraudulent, or misleading</li>
              <li>Violates any applicable law or regulation</li>
            </ul>
            <p className="mt-4">
              We reserve the right to remove any content that violates these terms or that we determine, at our sole discretion, is not in keeping with the spirit of the community.
            </p>
          </section>

          <section className="mb-10">
            <h2>5. Intellectual Property</h2>
            <p>
              The Frendr name, logo, and platform design are the intellectual property of Frendr Co. and may not be used without our express written permission. All other trademarks, logos, and service marks displayed on the Platform are the property of their respective owners.
            </p>
          </section>

          <section className="mb-10">
            <h2>6. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul className="mt-3 space-y-1.5">
              <li>Scrape, crawl, or systematically extract data from the Platform</li>
              <li>Use automated tools to interact with the Platform without our written consent</li>
              <li>Attempt to gain unauthorised access to any part of the Platform</li>
              <li>Impersonate another person or entity</li>
              <li>Use the Platform for any commercial purpose without our prior written approval</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2>7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for any reason, including violation of these Terms. You may delete your account at any time from your account settings. Upon termination, your content may be removed from the Platform.
            </p>
          </section>

          <section className="mb-10">
            <h2>8. Disclaimers & Limitation of Liability</h2>
            <p>
              Frendr is provided "as is" without warranties of any kind. We do not guarantee that the Platform will be available at all times or that it will be free of errors. To the fullest extent permitted by law, Frendr Co. shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.
            </p>
          </section>

          <section className="mb-10">
            <h2>9. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes by posting a notice on the Platform or by email. Your continued use of Frendr after changes take effect constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2>10. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
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
