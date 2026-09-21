import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const OPERATOR = "Finlay Kyle";
const CONTACT_EMAIL = "fnlkyle@gmail.com";
const WEBSITE = "id-preview--db6aee74-f175-4730-9470-b4408b7ec163.lovable.app";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Who We Are",
    body: (
      <>
        <p>Voices of Kindness is operated by:</p>
        <ul>
          <li>Operator: {OPERATOR}</li>
          <li>Website: {WEBSITE}</li>
          <li>Privacy contact: {CONTACT_EMAIL}</li>
        </ul>
        <p>If you have any questions about this Privacy Policy or how your information is handled, you can contact us using the details above.</p>
      </>
    ),
  },
  {
    title: "2. Information We Collect",
    body: (
      <>
        <p>The information we collect depends on how you use Voices of Kindness.</p>
        <p className="font-semibold text-foreground">2.1 Username and Account Information</p>
        <p>When you create an account, we collect information necessary to create and operate your account, including:</p>
        <ul>
          <li>Your chosen username</li>
          <li>Your password or authentication information (passwords are stored in a securely hashed form, not as readable passwords)</li>
          <li>Your profile icon or other profile information you choose to provide</li>
        </ul>
        <p>Voices of Kindness does not require you to provide a real email address to create an account.</p>
        <p>Our authentication system may use an internal account identifier for technical purposes, but we do not use this to collect or communicate with you through a personal email address.</p>
        <p className="font-semibold text-foreground">2.2 Voice Recordings</p>
        <p>When you record and submit a voice message, we collect and store the audio recording you choose to submit.</p>
        <p>Voice recordings are an important part of the Website and may be made available to other users through the Website.</p>
        <p>Because a person's voice can potentially identify them, you should consider carefully what you say in a recording before submitting it.</p>
        <p>Please do not include unnecessary personal information such as your full name, home address, telephone number, school, passwords or other private information in a public recording.</p>
        <p className="font-semibold text-foreground">2.3 Private Messages</p>
        <p>If the Website provides private messaging features, we collect and store the text messages that you send and receive through those features so that the messaging system can operate.</p>
        <p>Private messages are intended to remain private between the relevant users, subject to circumstances where disclosure is required or permitted by law or is reasonably necessary to protect users or the Website.</p>
        <p className="font-semibold text-foreground">2.4 Other Activity and Website Information</p>
        <p>We may store information relating to your use of the Website, including:</p>
        <ul>
          <li>Favourite or saved messages</li>
          <li>Thank-yous or reactions</li>
          <li>Reports that you submit</li>
          <li>Messages sent</li>
          <li>Streaks</li>
          <li>Achievements</li>
          <li>Other statistics associated with your account</li>
        </ul>
        <p>This information helps provide features such as profiles, achievements, statistics and other parts of the Website.</p>
        <p className="font-semibold text-foreground">2.5 Technical Information</p>
        <p>Our hosting and technical infrastructure may automatically process certain technical information necessary to operate, secure and maintain the Website. Depending on the technical services being used, this may include information such as:</p>
        <ul>
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Operating system</li>
          <li>Date and time of requests</li>
          <li>Technical logs</li>
          <li>Error and security information</li>
        </ul>
        <p>We do not use this information for behavioural advertising.</p>
      </>
    ),
  },
  {
    title: "3. Information We Do Not Currently Collect or Use",
    body: (
      <>
        <p>At the time this Privacy Policy was last updated, Voices of Kindness does not use:</p>
        <ul>
          <li>Google Analytics</li>
          <li>Advertising tracking pixels</li>
          <li>Behavioural advertising</li>
          <li>AI moderation or transcription services</li>
          <li>OpenAI or other AI processing services</li>
          <li>Stripe or other payment processing services</li>
          <li>Social-media login services</li>
          <li>Third-party email marketing services</li>
          <li>Real email communication with users</li>
        </ul>
        <p>If these services are introduced in the future, this Privacy Policy may be updated to explain how they are used.</p>
      </>
    ),
  },
  {
    title: "4. How We Use Your Information",
    body: (
      <>
        <p>We use information collected through Voices of Kindness to:</p>
        <ul>
          <li>Create and manage user accounts</li>
          <li>Allow users to record and listen to voice messages</li>
          <li>Store and deliver voice recordings</li>
          <li>Allow users to communicate through private messaging</li>
          <li>Provide favourites, thank-yous and other Website features</li>
          <li>Track achievements and usage statistics</li>
          <li>Process reports and investigate potential abuse</li>
          <li>Moderate content</li>
          <li>Protect users from misuse of the Website</li>
          <li>Detect and prevent security problems</li>
          <li>Maintain and improve the Website</li>
          <li>Fix technical problems</li>
          <li>Comply with legal obligations</li>
          <li>Protect the rights, safety and property of users and Voices of Kindness</li>
        </ul>
        <p>We will not intentionally use your information for purposes that are incompatible with those described in this Privacy Policy unless permitted or required by applicable law.</p>
      </>
    ),
  },
  {
    title: "5. Anonymous Voice Messages",
    body: (
      <>
        <p>Voices of Kindness is designed so that voice messages can be shared without necessarily publicly displaying the identity of the person who created them.</p>
        <p>Where a recording is displayed anonymously, other users may not be shown your username or other account information alongside the recording.</p>
        <p>However, anonymous to other users does not necessarily mean completely anonymous to us.</p>
        <p>Information connected with an account or recording may be retained where reasonably necessary to:</p>
        <ul>
          <li>Operate the Website</li>
          <li>Prevent abuse</li>
          <li>Investigate reports</li>
          <li>Protect users</li>
          <li>Maintain security</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>We will not intentionally publicly identify the creator of an anonymous recording unless the user chooses to identify themselves, gives permission for their identity to be disclosed, or disclosure is permitted or required by law.</p>
      </>
    ),
  },
  {
    title: "6. Voice Recordings and Public Content",
    body: (
      <>
        <p>If you submit a recording for other users to hear, you understand that the recording may be accessible to other users of Voices of Kindness.</p>
        <p>You should therefore avoid including information that you would not want other people to hear.</p>
        <p>Once a recording has been made available to other users, we cannot guarantee that another person will not independently record, copy or redistribute it.</p>
        <p>If you want a recording removed, you can contact us using the contact information provided in this Privacy Policy.</p>
      </>
    ),
  },
  {
    title: "7. Private Messages",
    body: (
      <>
        <p>Voices of Kindness may provide private messaging between users.</p>
        <p>We store private messages so that the messaging feature can function.</p>
        <p>Although messages are intended to be private, they may be accessed or disclosed where reasonably necessary to:</p>
        <ul>
          <li>Investigate reports of abuse</li>
          <li>Protect users</li>
          <li>Investigate security incidents</li>
          <li>Comply with legal obligations</li>
          <li>Protect the rights and safety of users or the Website</li>
        </ul>
        <p>We do not use private messages for advertising.</p>
      </>
    ),
  },
  {
    title: "8. How We Share Information",
    body: (
      <>
        <p>We do not sell your personal information.</p>
        <p>We may provide information to service providers that are necessary to operate Voices of Kindness.</p>
        <p>The Website currently relies on Lovable Cloud for core services including:</p>
        <ul>
          <li>Database storage</li>
          <li>Account authentication</li>
          <li>Voice-recording storage</li>
          <li>Realtime messaging functionality</li>
          <li>Other backend functionality required by the Website</li>
        </ul>
        <p>These services may process or store information on our behalf in order to provide the Website.</p>
        <p>We may also disclose information where reasonably necessary to:</p>
        <ul>
          <li>Comply with a legal obligation</li>
          <li>Respond to lawful requests from authorities</li>
          <li>Investigate suspected unlawful activity</li>
          <li>Investigate serious abuse or misuse of the Website</li>
          <li>Protect users or other people</li>
          <li>Protect the Website and its operators</li>
          <li>Address security or technical problems</li>
        </ul>
      </>
    ),
  },
  {
    title: "9. Third-Party Service Providers",
    body: (
      <>
        <p>Voices of Kindness currently uses Lovable's infrastructure, including Lovable Cloud, to provide important parts of the Website.</p>
        <p>Because third-party infrastructure is used, information submitted to Voices of Kindness may be processed or stored using systems operated by these service providers.</p>
        <p>We take reasonable steps to use appropriate services for operating the Website and protecting information.</p>
        <p>If we introduce additional third-party services that materially affect how personal information is processed, we may update this Privacy Policy accordingly.</p>
      </>
    ),
  },
  {
    title: "10. Cookies and Similar Technologies",
    body: (
      <>
        <p>Voices of Kindness does not currently use cookies or similar technologies for advertising or behavioural tracking.</p>
        <p>However, essential technical mechanisms may be used by the Website or its underlying services where necessary for functions such as:</p>
        <ul>
          <li>Keeping users authenticated</li>
          <li>Maintaining security</li>
          <li>Operating the Website</li>
          <li>Remembering necessary technical settings</li>
        </ul>
        <p>These essential technologies are different from advertising or behavioural tracking technologies.</p>
      </>
    ),
  },
  {
    title: "11. Data Security",
    body: (
      <>
        <p>We take reasonable technical and organisational measures to protect personal information against unauthorised access, loss, misuse, alteration or disclosure.</p>
        <p>These measures may include access controls, authentication systems and security measures provided by our hosting and backend infrastructure.</p>
        <p>However, no online service can guarantee that information will always be completely secure.</p>
        <p>If we become aware of a security incident involving personal information, we will take appropriate steps in accordance with applicable law.</p>
      </>
    ),
  },
  {
    title: "12. How Long We Keep Information",
    body: (
      <>
        <p>We retain information for as long as reasonably necessary for the purposes for which it was collected, unless a longer period is required or permitted by law.</p>
        <p>For example:</p>
        <ul>
          <li>Account information may be retained while your account is active.</li>
          <li>Voice recordings may be retained while they are available on the Website or while they are reasonably required for the purposes for which they were submitted.</li>
          <li>Private messages may be retained while necessary to provide the messaging functionality and for legitimate security or legal purposes.</li>
          <li>Reports and information relating to abuse or security incidents may be retained where reasonably necessary to investigate or prevent future incidents.</li>
        </ul>
        <p>When information is no longer reasonably required, we may delete, destroy or anonymise it where appropriate.</p>
      </>
    ),
  },
  {
    title: "13. Deleting Your Information",
    body: (
      <>
        <p>You may contact us if you would like to request deletion of personal information associated with your account or removal of a voice recording.</p>
        <p>You can contact us at: {CONTACT_EMAIL}</p>
        <p>We may need enough information to identify the relevant account or recording and, where appropriate, verify that you are entitled to make the request.</p>
        <p>Some information may need to be retained where required or permitted by law or where reasonably necessary for legitimate security, fraud-prevention or legal purposes.</p>
        <p>Deleting a recording from Voices of Kindness does not guarantee that copies made independently by other people will also be deleted.</p>
      </>
    ),
  },
  {
    title: "14. Your Privacy Rights",
    body: (
      <>
        <p>Subject to applicable law, you may have rights including the right to:</p>
        <ul>
          <li>Ask whether we hold personal information about you.</li>
          <li>Request access to personal information we hold about you.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of information in appropriate circumstances.</li>
          <li>Object to certain processing of your information.</li>
          <li>Withdraw consent where processing is based on consent.</li>
          <li>Ask questions about how your information is being processed.</li>
          <li>Lodge a complaint regarding the processing of your personal information.</li>
        </ul>
        <p>These rights may be subject to limitations and exceptions under applicable law.</p>
        <p>To exercise a privacy right, contact us using the details in Section 19.</p>
      </>
    ),
  },
  {
    title: "15. Children's Privacy",
    body: (
      <>
        <p>Voices of Kindness is intended to provide a positive environment for users.</p>
        <p>We do not intentionally request unnecessary personal information from children.</p>
        <p>Users should avoid including sensitive or unnecessary identifying information in public voice recordings, including:</p>
        <ul>
          <li>Full names</li>
          <li>Home addresses</li>
          <li>Telephone numbers</li>
          <li>School names</li>
          <li>Passwords</li>
          <li>Exact locations</li>
          <li>Other private information</li>
        </ul>
        <p>Where applicable law requires parental or guardian consent for the processing of a child's personal information, we will take reasonable steps to comply with those requirements.</p>
        <p>If you believe that a child has provided personal information in circumstances where it should not have been collected, please contact us.</p>
      </>
    ),
  },
  {
    title: "16. International Data Processing",
    body: (
      <>
        <p>Our use of third-party infrastructure means that personal information may potentially be stored or processed outside South Africa.</p>
        <p>Where applicable, we will take reasonable steps to ensure that international processing or transfers are handled in accordance with applicable South African law.</p>
      </>
    ),
  },
  {
    title: "17. Changes to This Privacy Policy",
    body: (
      <>
        <p>As Voices of Kindness develops, we may introduce new features or services that affect the information we collect or how information is processed.</p>
        <p>We may therefore update this Privacy Policy from time to time.</p>
        <p>The date at the top of this document shows when it was last updated.</p>
        <p>Where significant changes are made, we may provide an appropriate notice through the Website.</p>
      </>
    ),
  },
  {
    title: "18. Complaints",
    body: (
      <>
        <p>If you have concerns about how your personal information has been handled, please contact us first so that we can investigate the matter.</p>
        <p>You may also have the right to lodge a complaint with the Information Regulator of South Africa under applicable law.</p>
      </>
    ),
  },
  {
    title: "19. Contact Us",
    body: (
      <>
        <p>For privacy questions, requests or complaints, please contact:</p>
        <ul>
          <li>Voices of Kindness</li>
          <li>Operator: {OPERATOR}</li>
          <li>Email: {CONTACT_EMAIL}</li>
          <li>Website: {WEBSITE}</li>
        </ul>
      </>
    ),
  },
  {
    title: "20. Effective Date",
    body: (
      <>
        <p>This Privacy Policy is effective from: 17 September 2026</p>
        <p>By using Voices of Kindness, you acknowledge that you have had an opportunity to read this Privacy Policy and understand how information may be collected and processed as described above.</p>
      </>
    ),
  },
];

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-8 rounded-full bg-white/90 hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-sm text-muted-foreground">Last updated: 17 September 2026</p>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Voices of Kindness ("Voices of Kindness", "we", "us", "our", or "the Website").
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Voices of Kindness is a platform designed to allow people to share positive, supportive and encouraging voice messages with other users.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Policy explains what information we collect, how we use it, how we store it, when it may be shared, and what choices you have regarding your information.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We aim to handle personal information responsibly and in accordance with applicable South African privacy and data-protection laws, including the Protection of Personal Information Act 4 of 2013 ("POPIA").
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
        </div>
      </section>

      <footer className="py-8 text-center text-white/70 text-sm">
        <p>Made with ❤️ to spread positivity around the world</p>
      </footer>
    </div>
  );
};

export default Privacy;
