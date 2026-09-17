import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. About Voices of Kindness",
    body: (
      <>
        <p>Voices of Kindness allows users to record and submit voice messages intended to encourage, support or motivate other people.</p>
        <p>Messages may be made available to other users anonymously or without publicly displaying the identity of the person who submitted them.</p>
        <p>We aim to maintain a positive and supportive environment, but we cannot guarantee that every message submitted by users will always be positive, accurate, appropriate or suitable for every person.</p>
      </>
    ),
  },
  {
    title: "2. Eligibility",
    body: (
      <>
        <p>You must provide accurate information where information is requested from you.</p>
        <p>If you are under 18 years old, you should only use the Website with the permission and involvement of a parent or legal guardian where required by applicable law.</p>
        <p>You must not use the Website if you are prohibited from doing so under the laws applicable to you.</p>
      </>
    ),
  },
  {
    title: "3. Your Voice Recordings",
    body: (
      <>
        <p>When you submit a recording, you confirm that:</p>
        <ul>
          <li>The recording is your own original recording, or you have permission to use and submit it.</li>
          <li>You have the necessary rights to allow us to store and make the recording available through the Website.</li>
          <li>The recording does not intentionally contain another person's private or confidential information.</li>
          <li>The recording does not intentionally identify or target another person in a harmful manner.</li>
          <li>The recording does not contain threats, harassment, bullying, hate speech, sexually explicit material, or other unlawful content.</li>
          <li>The recording is not being submitted for the purpose of harming, intimidating, humiliating or deceiving another person.</li>
        </ul>
        <p>You remain responsible for the content that you submit.</p>
      </>
    ),
  },
  {
    title: "4. Permission to Use Submitted Content",
    body: (
      <>
        <p>When you submit a voice recording to Voices of Kindness, you give us a non-exclusive, worldwide, royalty-free permission to store, process, reproduce and make that recording available through the Website for the purposes of operating, maintaining and promoting Voices of Kindness.</p>
        <p>This permission does not mean that we own your voice or your recording.</p>
        <p>You continue to own any rights that you have in your recording.</p>
        <p>You may request removal of your recording in accordance with our procedures, subject to legal, technical or other legitimate requirements.</p>
      </>
    ),
  },
  {
    title: "5. Anonymous Recordings",
    body: (
      <>
        <p>Voices of Kindness may allow recordings to be displayed without publicly identifying the person who submitted them.</p>
        <p>However, anonymous to other users does not necessarily mean completely anonymous.</p>
        <p>We may collect technical or account information associated with submissions where necessary to operate the Website, prevent abuse, comply with the law, investigate violations, or protect users.</p>
        <p>We will handle personal information in accordance with our Privacy Policy and applicable data-protection laws.</p>
      </>
    ),
  },
  {
    title: "6. Prohibited Content",
    body: (
      <>
        <p>You must not submit or use the Website to distribute content that:</p>
        <ul>
          <li>Contains threats of violence or harm.</li>
          <li>Encourages or promotes self-harm or harm to others.</li>
          <li>Harasses, bullies, intimidates or targets another person.</li>
          <li>Contains hate speech or unlawful discriminatory content.</li>
          <li>Contains sexually explicit or inappropriate material.</li>
          <li>Deliberately spreads false accusations about identifiable people.</li>
          <li>Reveals another person's private, confidential or sensitive information without permission.</li>
          <li>Impersonates another person.</li>
          <li>Infringes copyright, trademark, privacy, publicity or other rights.</li>
          <li>Contains malware, malicious code or attempts to interfere with the Website.</li>
          <li>Is illegal under applicable law.</li>
          <li>Is otherwise seriously inconsistent with the purpose of Voices of Kindness.</li>
        </ul>
        <p>We may remove content that we believe violates these Terms or that creates a safety, legal or operational risk.</p>
      </>
    ),
  },
  {
    title: "7. Reporting Content",
    body: (
      <>
        <p>If you encounter a recording that you believe violates these Terms, you should report it using the reporting mechanism provided on the Website.</p>
        <p>We may review reported content and may remove, restrict or disable access to content where appropriate.</p>
        <p>Submitting a report does not guarantee that content will be removed.</p>
      </>
    ),
  },
  {
    title: "8. Moderation",
    body: (
      <>
        <p>We may use automated systems, manual review, or a combination of both to identify potentially inappropriate recordings.</p>
        <p>Moderation systems are not perfect. We cannot guarantee that every inappropriate recording will be detected or removed immediately.</p>
        <p>We reserve the right to remove or restrict content at our discretion where reasonably necessary to protect users, the Website or third parties.</p>
      </>
    ),
  },
  {
    title: "9. Copyright and Intellectual Property",
    body: (
      <>
        <p>You must not upload recordings, music, sound effects, speeches, videos or other material that you do not have the right to use.</p>
        <p>For example, you should not download someone's voice recording from YouTube, TikTok, Instagram or another platform and upload it to Voices of Kindness unless you have permission or another valid legal basis to do so.</p>
        <p>The Website, including its design, branding, software, logos, text and other original materials, may be protected by intellectual-property laws.</p>
        <p>You may not copy, reproduce, modify, distribute or commercially exploit our Website or its original materials without appropriate permission.</p>
      </>
    ),
  },
  {
    title: "10. Removal and Suspension",
    body: (
      <>
        <p>We may suspend or terminate a user's access to the Website if we reasonably believe that the user:</p>
        <ul>
          <li>Has violated these Terms.</li>
          <li>Has submitted unlawful or harmful material.</li>
          <li>Has abused another user.</li>
          <li>Has attempted to interfere with the Website.</li>
          <li>Has repeatedly submitted content that violates our rules.</li>
          <li>Creates a significant safety, security or legal risk.</li>
        </ul>
        <p>We may also remove individual recordings without suspending the user's account.</p>
      </>
    ),
  },
  {
    title: "11. Privacy",
    body: (
      <>
        <p>We may collect and process information necessary to provide and protect the Website.</p>
        <p>This may include information associated with accounts, recordings, technical information and information relating to Website usage.</p>
        <p>Voice recordings may contain information that can relate to an identifiable individual. We will handle personal information in accordance with applicable privacy and data-protection laws.</p>
        <p>For more information about how we collect, use, store and protect personal information, please read our Privacy Policy.</p>
      </>
    ),
  },
  {
    title: "12. Security",
    body: (
      <>
        <p>We take reasonable steps to protect information and the Website from unauthorised access, misuse and other security risks.</p>
        <p>However, no online service can guarantee complete security.</p>
        <p>You understand that submitting information or recordings online involves some level of risk.</p>
      </>
    ),
  },
  {
    title: "13. Third-Party Services",
    body: (
      <>
        <p>The Website may rely on third-party services for things such as hosting, databases, authentication, audio storage, analytics, payments or other technical functions.</p>
        <p>Those services may have their own terms and privacy policies.</p>
        <p>We are not responsible for services or websites that are controlled by third parties, except to the extent required by applicable law.</p>
      </>
    ),
  },
  {
    title: "14. No Guarantee",
    body: (
      <>
        <p>We intend Voices of Kindness to provide a positive and supportive experience, but we do not guarantee that:</p>
        <ul>
          <li>The Website will always be available.</li>
          <li>Every recording will be positive or appropriate.</li>
          <li>Every recording will be available permanently.</li>
          <li>The Website will be free from errors or technical problems.</li>
          <li>Content submitted by users will always be accurate or reliable.</li>
          <li>The Website will meet every user's individual expectations.</li>
        </ul>
      </>
    ),
  },
  {
    title: "15. User Responsibility",
    body: (
      <>
        <p>You are responsible for your own use of the Website and for recordings or other content that you submit.</p>
        <p>Voices of Kindness is not a substitute for professional medical, psychological, legal or other professional services.</p>
        <p>If you are experiencing a serious personal crisis or believe that you or another person may be in immediate danger, contact an appropriate emergency service, trusted adult, parent/guardian or qualified professional.</p>
      </>
    ),
  },
  {
    title: "16. Limitation of Liability",
    body: (
      <>
        <p>To the maximum extent permitted by applicable law, Voices of Kindness and its operators will not be responsible for indirect, incidental or consequential losses arising from your use of the Website.</p>
        <p>Nothing in these Terms is intended to exclude or limit liability where such exclusion or limitation would be unlawful under applicable law.</p>
        <p>Nothing in these Terms removes any rights or protections that you may have under applicable consumer-protection or other mandatory laws.</p>
      </>
    ),
  },
  {
    title: "17. Changes to the Website",
    body: (
      <>
        <p>We may add, remove or change features of Voices of Kindness from time to time.</p>
        <p>We may also update these Terms when reasonably necessary.</p>
        <p>When we make significant changes, we may provide notice through the Website or another appropriate method.</p>
        <p>Your continued use of the Website after updated Terms become effective means that you accept the updated Terms.</p>
      </>
    ),
  },
  {
    title: "18. Governing Law",
    body: (
      <>
        <p>These Terms are governed by the laws of the Republic of South Africa, unless applicable law requires otherwise.</p>
        <p>Any disputes will be subject to the jurisdiction of the appropriate courts of South Africa, subject to any mandatory rights you may have under applicable law.</p>
      </>
    ),
  },
  {
    title: "19. Contact",
    body: (
      <>
        <p>If you have questions, concerns, requests regarding your content, or reports concerning the Website, please contact us:</p>
        <p>Email: <a href="mailto:fnlkyle@gmail.com" className="text-primary underline">fnlkyle@gmail.com</a></p>
        <p>Website operator: Finlay Kyle</p>
      </>
    ),
  },
  {
    title: "20. Acceptance",
    body: (
      <>
        <p>By using Voices of Kindness, you confirm that you have read and understood these Terms and agree to comply with them.</p>
      </>
    ),
  },
];

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-white/20 p-5 rounded-full shadow-glow backdrop-blur-sm">
            <FileText className="w-14 h-14 text-white" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          Terms and Conditions
        </h1>

        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Last updated: 17 September 2026
        </p>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Intro */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Voices of Kindness ("we", "us", "our", or "the Website").
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Voices of Kindness is a platform designed to allow people to share positive, supportive and encouraging voice messages with other users. By accessing or using the Website, you agree to these Terms and Conditions ("Terms").
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you do not agree with these Terms, please do not use the Website.
            </p>
          </div>

          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow space-y-4"
            >
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
                {section.body}
              </div>
            </div>
          ))}

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow text-center">
            <p className="text-muted-foreground leading-relaxed">
              Thank you for helping us keep Voices of Kindness supportive, respectful and safe.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-white/70 text-sm">
        <p>Made with ❤️ to spread positivity around the world</p>
      </footer>
    </div>
  );
};

export default Terms;
