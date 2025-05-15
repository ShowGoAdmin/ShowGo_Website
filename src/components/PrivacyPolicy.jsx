import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
     return (
          <div className="min-h-screen bg-black text-white p-6 md:p-12">
               <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy for ShowGo</h1>

                    <div className="prose prose-invert max-w-none">
                         <p className="mb-6">
                              This privacy policy outlines how ShowGo ("we", "our", "us") collects, uses, and protects your personal information when you use our mobile application ("App"). By using the App, you agree to the terms outlined in this privacy policy.
                         </p>

                         <p className="mb-6">
                              ShowGo is committed to safeguarding your privacy. Any personal information collected will only be used in accordance with this policy, and we may update it from time to time. Please review it periodically to stay informed of any changes.
                         </p>

                         <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
                         <p className="mb-4">
                              We may collect the following information:
                         </p>
                         <ul className="list-disc pl-6 mb-6">
                              <li>Name and contact details (such as email address or phone number).</li>
                              <li>Demographic information (such as location, preferences, or interests).</li>
                              <li>App usage data and analytics to improve functionality.</li>
                              <li>Media files (images, videos) accessed or captured via your device.</li>
                              <li>UPI ID: If you wish to sell your tickets on the marketplace, we will collect your UPI ID to facilitate secure and convenient payment transactions.</li>
                         </ul>

                         <h2 className="text-2xl font-semibold mt-8 mb-4">Permissions We Require</h2>
                         <p className="mb-4">
                              To provide a better user experience, the App requests access to the following features on your device:
                         </p>
                         <ul className="list-disc pl-6 mb-6">
                              <li><strong>Location:</strong> We request access to your device's location to provide location-based features (e.g., showing events near you).</li>
                              <li><strong>Internet:</strong> The App requires internet access to fetch content, sync data, and communicate with our servers.</li>
                              <li><strong>Camera Access:</strong> We ask for permission to use your device's camera for capturing images or videos within the App.</li>
                              <li><strong>Media and File Storage:</strong> We request access to your device's storage to read images or videos stored on your phone and save files created within the App.</li>
                              <li><strong>External Storage:</strong> For Android versions below Android 12, we may need access to your device's storage to save and retrieve media files (images).</li>
                              <li><strong>Notifications:</strong> We ask for permission to send notifications, such as reminders, updates, and promotional offers.</li>
                         </ul>

                         <h2 className="text-2xl font-semibold mt-8 mb-4">What We Do with the Information We Collect</h2>
                         <p className="mb-4">
                              We collect this information to:
                         </p>
                         <ul className="list-disc pl-6 mb-6">
                              <li>Personalize the App experience by offering tailored features based on your preferences.</li>
                              <li>Improve the functionality, performance, and security of the App.</li>
                              <li>Notify you about new updates, promotions, or features.</li>
                              <li>Analyze usage patterns to help us optimize and improve the App.</li>
                              <li>Facilitate Marketplace Transactions: We use your UPI ID for processing payments related to the sale of tickets on the marketplace.</li>
                         </ul>

                         <h2 className="text-2xl font-semibold mt-8 mb-4">How We Protect Your Information</h2>
                         <p className="mb-6">
                              We are committed to securing your personal information. We use appropriate security measures to prevent unauthorized access, misuse, or disclosure of your data.
                         </p>

                         <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Cookies and Tracking Technologies</h2>
                         <p className="mb-4">
                              Cookies and similar technologies may be used to:
                         </p>
                         <ul className="list-disc pl-6 mb-6">
                              <li>Analyze App usage and performance.</li>
                              <li>Customize content based on your preferences.</li>
                              <li>Improve overall user experience.</li>
                         </ul>
                         <p className="mb-6">
                              You can manage cookies through your device's settings, though some features of the App may not work properly if you choose to disable them.
                         </p>

                         <h2 className="text-2xl font-semibold mt-8 mb-4">Controlling Your Personal Information</h2>
                         <p className="mb-4">
                              You have control over the information we collect. You can choose to:
                         </p>
                         <ul className="list-disc pl-6 mb-6">
                              <li>Limit or disable permissions (e.g., turning off location services or camera access) from within your device's settings.</li>
                              <li>Opt out of receiving promotional emails or notifications.</li>
                              <li>Manage your UPI ID or delete it if you no longer wish to use the marketplace feature.</li>
                         </ul>
                         <p className="mb-6">
                              We do not sell, distribute, or lease your personal information to third parties without your consent, unless required by law.
                         </p>

                         <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
                         <p className="mb-4">
                              You have the right to:
                         </p>
                         <ul className="list-disc pl-6 mb-6">
                              <li>Access and update your personal information.</li>
                              <li>Request the deletion of your personal data.</li>
                              <li>Opt out of promotional communications.</li>
                         </ul>
                         <p className="mb-6">
                              If you believe any information we hold about you is incorrect, please contact us at info@showgo.in, and we will promptly update it.
                         </p>

                         <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
                         <p className="mb-2">
                              For any questions or concerns about this privacy policy, please contact:
                         </p>
                         <address className="not-italic mb-2">
                              ShowGo<br />
                              17, Dutta Enclave, GMS Road, Kanwali, Kanwali, Dehradun, Dehradun- 248001, Uttarakhand
                         </address>
                         <p className="mb-6">
                              Email: <a href="mailto:info@showgo.in" className="text-blue-400 hover:underline">info@showgo.in</a>
                         </p>

                         <p className="text-sm text-gray-400 mt-12">
                              Disclaimer: This policy is specific to ShowGo and may not cover all aspects of data protection law in your jurisdiction.
                         </p>
                    </div>

                    <div className="mt-12 text-center">
                         <Link
                              to="/"
                              className="inline-block bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                              onClick={() => window.scrollTo(0, 0)}
                         >
                              Back to Home
                         </Link>
                    </div>
               </div>
          </div>
     );
};

export default PrivacyPolicy;