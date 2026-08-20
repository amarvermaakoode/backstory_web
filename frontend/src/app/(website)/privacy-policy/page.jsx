"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ShieldCheck,
    Lock,
    Eye,
    FileText,
    Mail,
    MapPin,
    Phone,
    UserCheck,
    Key,
    ExternalLink,
    Search,
    ChevronRight,
    Sparkles,
    AlertCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Privacy Policy Data Structure
const policySections = [
    {
        number: "01",
        id: "about-bacstory",
        title: "ABOUT BACSTORY",
        summary: "Brand mission and scope of digital services and QR-enabled garments.",
        content: (
            <div className="space-y-3 text-neutral-600 text-sm leading-relaxed">
                <p>
                    Bacstory is a lifestyle and apparel brand built around the idea that every person has a story worth wearing.
                </p>
                <p>
                    Our products may include unique QR codes or digital identifiers that allow a purchaser or wearer to activate a garment and create or access a personal Bacstory profile.
                </p>
                <p>
                    This Privacy Policy applies to information collected through our website, online store, garment activation system, customer support channels, marketing communications, and other Bacstory digital services.
                </p>
            </div>
        ),
    },
    {
        number: "02",
        id: "information-we-collect",
        title: "INFORMATION WE COLLECT",
        summary: "Directly provided, profile-related, and automatically collected user information.",
        content: (
            <div className="space-y-6 text-sm leading-relaxed text-neutral-600">
                <p>Depending on how you interact with Bacstory, we may collect the following categories of information.</p>

                {/* Sub A */}
                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-neutral-200/70 space-y-3">
                    <h4 className="font-semibold text-black text-base font-sans flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-black text-white text-xs flex items-center justify-center font-bold">A</span>
                        Information You Provide Directly
                    </h4>
                    <p className="text-xs text-neutral-500">When you purchase a product, register an account, activate a garment, or contact us, we may collect:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700 font-medium pt-1">
                        {[
                            "Full name",
                            "Email address",
                            "Mobile phone number",
                            "Billing and shipping address",
                            "Order ID",
                            "Product and garment details",
                            "Payment-related information necessary to process transaction",
                            "OTP verification information",
                            "Information submitted through customer support",
                            "Other information you voluntarily provide to us",
                        ].map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-neutral-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-neutral-400 italic pt-1">
                        We do not intend to collect more personal information than is reasonably necessary for the specific purpose for which it is collected.
                    </p>
                </div>

                {/* Sub B */}
                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-neutral-200/70 space-y-3">
                    <h4 className="font-semibold text-black text-base font-sans flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-black text-white text-xs flex items-center justify-center font-bold">B</span>
                        Bacstory Profile Information
                    </h4>
                    <p className="text-xs text-neutral-500">If you choose to create a Bacstory profile associated with your garment, you may provide information such as:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700 font-medium pt-1">
                        {[
                            "Name or display name",
                            "Bio",
                            "Profession or occupation",
                            "Interests and hobbies",
                            "Custom text or personal story",
                            "Social media handles or links",
                            "Portfolio or website links",
                            "Profile photograph",
                            "Other information you voluntarily choose to display",
                        ].map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-neutral-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-900 font-medium flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>You control the information you choose to add to your public profile. Please do not submit sensitive personal information that you do not wish to make publicly accessible.</span>
                    </div>
                </div>

                {/* Sub C */}
                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-neutral-200/70 space-y-3">
                    <h4 className="font-semibold text-black text-base font-sans flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-black text-white text-xs flex items-center justify-center font-bold">C</span>
                        Information Collected Automatically
                    </h4>
                    <p className="text-xs text-neutral-500">When you use our website or services, certain technical information may be collected automatically, including:</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {[
                            "IP address",
                            "Browser type",
                            "Device type",
                            "Operating system",
                            "Website pages visited",
                            "Approximate usage information",
                            "Date and time of access",
                            "Referral or source information",
                            "Cookies and similar technologies",
                        ].map((tech, idx) => (
                            <span key={idx} className="bg-white border border-neutral-200/80 px-3 py-1.5 rounded-lg text-xs text-neutral-700 font-medium shadow-2xs">
                                {tech}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-neutral-500 pt-1">
                        This information helps us operate, secure, improve, and analyse our website and services.
                    </p>
                </div>
            </div>
        ),
    },
    {
        number: "03",
        id: "qr-code-and-garment-activation",
        title: "QR CODE AND GARMENT ACTIVATION",
        summary: "Details on unique garment identifiers, QR scanning, and data boundaries.",
        content: (
            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
                <p>Certain Bacstory garments may contain a unique QR code or digital identifier.</p>
                <p>When you scan or activate a garment, we may process information such as:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700 font-medium">
                    {[
                        "QR code or garment identifier",
                        "Order ID",
                        "Registered email address or mobile number",
                        "OTP verification information",
                        "Product or garment information",
                        "Activation status",
                        "Information you choose to associate with the garment",
                    ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
                <p>
                    We use this information to verify ownership or eligibility, activate the garment, prevent unauthorised claims, provide the associated digital experience, and maintain the integrity of the Bacstory platform.
                </p>

                {/* Important Privacy Boundary Highlight Box */}
                <div className="bg-black text-white p-5 rounded-2xl space-y-1 shadow-md">
                    <h5 className="font-semibold text-sm font-clashDisplay text-neutral-100 flex items-center gap-2">
                        Garment QR Code Privacy Guarantee
                    </h5>
                    <p className="text-xs text-neutral-300 font-normal leading-relaxed">
                        Scanning a Bacstory QR code does not, by itself, give Bacstory access to unrelated information stored on your phone.
                    </p>
                </div>
            </div>
        ),
    },
    {
        number: "04",
        id: "how-we-use-your-information",
        title: "HOW WE USE YOUR INFORMATION",
        summary: "14 core operational, fulfillment, and analytical purposes.",
        content: (
            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
                <p>We may use your personal information for purposes including:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-800 font-medium">
                    {[
                        "1. Processing and fulfilling orders.",
                        "2. Delivering products to you.",
                        "3. Verifying your identity or ownership during garment activation.",
                        "4. Sending OTPs and transactional communications.",
                        "5. Creating and managing your Bacstory profile.",
                        "6. Displaying information that you have voluntarily chosen to make public.",
                        "7. Providing customer support.",
                        "8. Processing returns, exchanges, refunds, and warranty-related requests.",
                        "9. Preventing fraud, abuse, unauthorised garment activation, and other misuse.",
                        "10. Maintaining and improving our website and services.",
                        "11. Understanding product and website usage.",
                        "12. Sending marketing or promotional communications where permitted and, where required, based on your consent.",
                        "13. Complying with applicable legal and regulatory requirements.",
                        "14. Protecting the rights, property, security, and safety of Bacstory, our users, and others.",
                    ].map((purpose, idx) => (
                        <div key={idx} className="bg-white p-3.5 rounded-xl border border-neutral-200/70 flex items-start gap-2.5 shadow-2xs">
                            <span className="w-5 h-5 rounded-full bg-neutral-100 text-black flex items-center justify-center font-bold text-[10px] shrink-0 border border-neutral-200">
                                {idx + 1}
                            </span>
                            <span className="text-xs text-neutral-700 leading-normal">{purpose.replace(/^\d+\.\s*/, "")}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-neutral-500 pt-2 border-t border-neutral-100">
                    We will not use your personal information for purposes materially unrelated to the purposes communicated to you without an appropriate legal basis or notice where required by applicable law.
                </p>
            </div>
        ),
    },
    {
        number: "05",
        id: "public-bacstory-profiles",
        title: "PUBLIC BACSTORY PROFILES",
        summary: "Guidelines on user-generated content and prohibited sensitive uploads.",
        content: (
            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
                <p>Bacstory may allow users to create a profile connected to a garment.</p>
                <p>
                    If you choose to make your profile public, information such as your display name, bio, profile photograph, profession, interests, social links, portfolio links, or other content you voluntarily publish may be visible to other people.
                </p>
                <div className="bg-red-50/80 border border-red-200 p-4 rounded-2xl space-y-3">
                    <p className="font-semibold text-xs text-red-900 uppercase tracking-wider">
                        Please carefully consider what you publish on your Bacstory profile. You should NOT upload:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-red-800 font-medium">
                        {[
                            "Passwords",
                            "Financial information",
                            "Government identification numbers",
                            "Private contact information you do not wish to disclose",
                            "Sensitive personal information",
                            "Information belonging to another person without permission",
                        ].map((noUpload, idx) => (
                            <li key={idx} className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-lg border border-red-200/60">
                                <span className="text-red-600 font-bold">✕</span>
                                <span>{noUpload}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="text-xs text-neutral-500">
                    You may be able to edit, update, or request removal of profile information through the mechanisms provided by Bacstory.
                </p>
            </div>
        ),
    },
    {
        number: "06",
        id: "cookies-and-similar-technologies",
        title: "COOKIES AND SIMILAR TECHNOLOGIES",
        summary: "Usage of cookies, analytics tools, and local storage.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>We may use cookies, pixels, local storage, analytics tools, and similar technologies to:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700 font-medium">
                    {[
                        "Keep our website functioning",
                        "Remember preferences",
                        "Understand website usage",
                        "Improve performance",
                        "Detect security issues",
                        "Measure marketing effectiveness",
                        "Provide relevant communications or advertising where applicable",
                    ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-neutral-500">
                    You may be able to control cookies through your browser or device settings. Disabling certain cookies may affect some website functionality.
                </p>
            </div>
        ),
    },
    {
        number: "07",
        id: "payment-information",
        title: "PAYMENT INFORMATION",
        summary: "Third-party payment processor security standards.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>Payments may be processed through third-party payment service providers.</p>
                <p>
                    Bacstory generally does not need to store your complete payment card details when the payment is processed by a third-party payment provider.
                </p>
                <p className="text-xs text-neutral-500">
                    Your payment information may be subject to the privacy policies and terms of the relevant payment service provider.
                </p>
            </div>
        ),
    },
    {
        number: "08",
        id: "when-we-share-information",
        title: "WHEN WE SHARE INFORMATION",
        summary: "Authorized third-party service categories and legal disclosures.",
        content: (
            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
                <p>We may share personal information with trusted third parties where reasonably necessary to operate Bacstory and provide our services.</p>
                <div className="flex flex-wrap gap-2 text-xs text-neutral-800 font-medium">
                    {[
                        "Payment processors",
                        "Shipping and logistics providers",
                        "Website and hosting providers",
                        "Cloud storage providers",
                        "OTP and communication service providers",
                        "Analytics and technology providers",
                        "Customer-support providers",
                        "Professional advisers",
                        "Fraud-prevention and security providers",
                    ].map((partner, idx) => (
                        <span key={idx} className="bg-[#F4F4F4] border border-neutral-200 px-3 py-1.5 rounded-xl">
                            {partner}
                        </span>
                    ))}
                </div>
                <p className="text-xs text-neutral-500">
                    These parties may process information on our behalf and, where applicable, are expected to maintain appropriate safeguards for personal information.
                </p>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2 text-xs">
                    <p className="font-semibold text-black">We may also disclose information:</p>
                    <ul className="space-y-1.5 text-neutral-700">
                        <li>• When required by applicable law</li>
                        <li>• In response to a lawful request from a government or regulatory authority</li>
                        <li>• To investigate fraud, abuse, security incidents, or unlawful activity</li>
                        <li>• To protect our legal rights or property</li>
                        <li>• In connection with a merger, acquisition, restructuring, financing, sale of assets, or similar business transaction</li>
                    </ul>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>We do not sell your personal information as a standalone product to third parties.</span>
                </div>
            </div>
        ),
    },
    {
        number: "09",
        id: "data-security",
        title: "DATA SECURITY",
        summary: "Technical and organizational protections for user data.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>
                    We take reasonable technical and organisational measures designed to protect personal information against unauthorised access, alteration, disclosure, loss, misuse, or destruction.
                </p>
                <p>
                    Depending on the nature of the information and service, these measures may include access controls, authentication mechanisms, encryption or secure transmission, monitoring, and other security practices.
                </p>
                <p className="text-xs text-neutral-500 italic">
                    However, no method of transmitting or storing information over the internet can be guaranteed to be completely secure.
                </p>
            </div>
        ),
    },
    {
        number: "10",
        id: "data-retention",
        title: "DATA RETENTION",
        summary: "Retention criteria, dispute resolution, and anonymization.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>We retain personal information only for as long as reasonably necessary for the purposes described in this Privacy Policy, including to:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700 font-medium">
                    {[
                        "Provide our services",
                        "Maintain customer and transaction records",
                        "Maintain garment activation records",
                        "Resolve disputes",
                        "Prevent fraud and misuse",
                        "Comply with legal, accounting, tax, or regulatory requirements",
                        "Enforce our agreements",
                    ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-neutral-500">
                    When personal information is no longer reasonably required, we may delete, anonymise, or otherwise dispose of it in accordance with applicable law and our internal retention practices.
                </p>
            </div>
        ),
    },
    {
        number: "11",
        id: "your-rights",
        title: "YOUR RIGHTS",
        summary: "User rights under law and Digital Personal Data Protection Act compliance.",
        content: (
            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
                <p>Subject to applicable law, you may have rights relating to your personal information, including the right to:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-800 font-medium">
                    {[
                        "Request information about the personal data we process",
                        "Request correction or updating of inaccurate information",
                        "Request deletion of personal information where legally permissible",
                        "Withdraw consent where processing is based on consent",
                        "Request information about the processing of your personal data",
                        "Raise a grievance or complaint regarding our processing of personal information",
                        "Exercise other rights available to you under applicable data-protection law",
                    ].map((rightItem, idx) => (
                        <li key={idx} className="bg-white p-3 rounded-xl border border-neutral-200/70 flex items-start gap-2">
                            <UserCheck className="w-4 h-4 text-black shrink-0 mt-0.5" />
                            <span>{rightItem}</span>
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-neutral-500">
                    Where processing is based on consent, you may withdraw that consent. Withdrawal of consent will not affect the lawfulness of processing carried out before the withdrawal. Some information may need to be retained where required or permitted by law.
                </p>
                <div className="bg-neutral-100 p-3.5 rounded-xl text-xs text-neutral-800 font-medium border border-neutral-200">
                    The Digital Personal Data Protection Act provides for withdrawal of consent and cessation of processing, subject to applicable legal requirements and exceptions.
                </div>
            </div>
        ),
    },
    {
        number: "12",
        id: "how-to-exercise-your-rights",
        title: "HOW TO EXERCISE YOUR RIGHTS",
        summary: "Contact details and identity verification procedures.",
        content: (
            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
                <p>To request access, correction, deletion, withdrawal of consent, or other privacy-related assistance, please contact us using the details below:</p>

                <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-2xs space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-neutral-600 shrink-0" />
                        <span className="text-neutral-500 font-medium">Email:</span>
                        <a href="mailto:ceo@bacstory.com" className="text-black font-semibold hover:underline">
                            ceo@bacstory.com
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        <UserCheck className="w-4 h-4 text-neutral-600 shrink-0" />
                        <span className="text-neutral-500 font-medium">Grievance / Privacy Contact:</span>
                        <span className="text-black font-semibold">[Insert Name or Designation]</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                        <span className="text-neutral-500 font-medium">Address:</span>
                        <span className="text-black font-semibold">D-43, Sector-61, Noida</span>
                    </div>
                </div>

                <p className="text-xs text-neutral-500">
                    We may need to verify your identity before acting on certain requests in order to protect your account and personal information. We will handle valid requests within the period required under applicable law.
                </p>
            </div>
        ),
    },
    {
        number: "13",
        id: "childrens-privacy",
        title: "CHILDREN'S PRIVACY",
        summary: "Protection of children's data and guardian consent.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>
                    Bacstory&apos;s services are not intended to knowingly collect personal information from children in circumstances where parental or lawful guardian consent is required without obtaining such consent.
                </p>
                <p className="text-xs text-neutral-500">
                    If you believe that a child has provided personal information to us in circumstances where such collection was not appropriate, please contact us so that we can review and take appropriate action.
                </p>
            </div>
        ),
    },
    {
        number: "14",
        id: "third-party-links-and-services",
        title: "THIRD-PARTY LINKS AND SERVICES",
        summary: "External website policies and boundary of liability.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>
                    Our website or Bacstory profiles may contain links to third-party websites, applications, social media platforms, portfolios, or other services.
                </p>
                <p>
                    Once you leave Bacstory&apos;s website or interact directly with a third-party service, that third party&apos;s privacy policy and terms may apply.
                </p>
                <p className="text-xs text-neutral-500 italic">
                    Bacstory is not responsible for the privacy practices, security, or content of third-party services.
                </p>
            </div>
        ),
    },
    {
        number: "15",
        id: "international-data-processing",
        title: "INTERNATIONAL DATA PROCESSING",
        summary: "Data transfers and global processing safeguards.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>
                    Some of our technology, hosting, analytics, payment, communication, or other service providers may process information outside India.
                </p>
                <p className="text-xs text-neutral-500">
                    Where personal information is transferred or processed outside India, Bacstory will take steps required by applicable law and applicable contractual or organisational safeguards.
                </p>
            </div>
        ),
    },
    {
        number: "16",
        id: "marketing-communications",
        title: "MARKETING COMMUNICATIONS",
        summary: "Promotional updates opt-out options and transactional notifications.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>
                    Where permitted by applicable law, Bacstory may send you promotional communications about products, collections, events, offers, collaborations, or other Bacstory activities.
                </p>
                <p>
                    You may opt out of promotional communications by using the unsubscribe mechanism provided in the communication or by contacting us.
                </p>
                <p className="text-xs text-neutral-500">
                    Even if you opt out of marketing communications, we may continue sending essential transactional or service-related communications, such as order confirmations, delivery updates, OTPs, security notifications, or important account information.
                </p>
            </div>
        ),
    },
    {
        number: "17",
        id: "changes-to-this-privacy-policy",
        title: "CHANGES TO THIS PRIVACY POLICY",
        summary: "Policy modification processes and effective dates.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>
                    We may update this Privacy Policy from time to time to reflect changes in our services, technology, legal requirements, or business practices.
                </p>
                <p>
                    When we make material changes, we may provide an appropriate notice through our website, email, account interface, or other reasonable means.
                </p>
                <p className="text-xs text-neutral-500">
                    The updated Privacy Policy will become effective from the date stated at the beginning of the revised policy.
                </p>
            </div>
        ),
    },
    {
        number: "18",
        id: "governing-law",
        title: "GOVERNING LAW",
        summary: "Applicable Indian laws and jurisdiction.",
        content: (
            <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                <p>This Privacy Policy shall be governed by the laws applicable in India.</p>
                <p className="text-xs text-neutral-500">
                    Any disputes relating to this Privacy Policy shall be subject to the applicable jurisdiction and dispute-resolution mechanisms provided under Indian law.
                </p>
            </div>
        ),
    },
    {
        number: "19",
        id: "contact-us",
        title: "CONTACT US",
        summary: "Official contact details for privacy inquiries.",
        content: (
            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
                <p>If you have questions, concerns, requests, or complaints regarding this Privacy Policy or the way Bacstory handles personal information, please contact:</p>

                <div className="bg-[#101820] text-white p-6 rounded-2xl shadow-md space-y-3 font-sans">
                    <h4 className="font-semibold text-lg font-clashDisplay text-white">Bacstory Privacy Team</h4>
                    <div className="space-y-2 text-xs sm:text-sm text-neutral-300">
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-white shrink-0" />
                            <span className="text-neutral-400">Email:</span>
                            <a href="mailto:ceo@bacstory.com" className="text-white hover:underline font-medium">
                                ceo@bacstory.com
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-white shrink-0" />
                            <span className="text-neutral-400">Customer Support:</span>
                            <a href="tel:+919711969291" className="text-white hover:underline font-medium">
                                +91-9711969291
                            </a>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                            <span className="text-neutral-400">Registered Address:</span>
                            <span className="text-white font-medium">D-43, Sector-61, Noida</span>
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
];

export default function PrivacyPolicyPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSections = policySections.filter((section) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            section.title.toLowerCase().includes(q) ||
            section.summary.toLowerCase().includes(q) ||
            section.number.includes(q)
        );
    });

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9] text-black flex flex-col font-sans">
            <Navbar solid={true} light={true} />

            <main className="flex-1 w-full pt-10">
                {/* Hero Header Section - Identical to Return & Exchange page banner */}
                <div className="relative w-full h-[200px] sm:h-[320px] md:h-[42vh] bg-black text-white flex flex-col justify-between p-6 sm:p-10 md:p-14 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/images/landing-page/discover-more.png"
                            alt="Privacy Policy Banner"
                            fill
                            priority
                            className="object-cover object-center opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
                    </div>

                    <div className="relative z-20 mx-auto max-w-[100%] w-full h-full flex flex-col justify-between">
                        <nav className="text-xs sm:text-sm text-white/90 font-normal mt-12 md:mt-14 flex items-center gap-2">
                            <Link href="/" className="hover:text-white transition-colors">
                                Home
                            </Link>
                            <span>/</span>
                            <Link href="/faq" className="hover:text-white transition-colors">
                                Support
                            </Link>
                            <span>/</span>
                            <span className="text-white font-medium">Privacy Policy</span>
                        </nav>

                        <div className="mb-6 space-y-3">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-clashDisplay tracking-tight">
                                Privacy Policy
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Content Container - Matching exact Return & Exchange 2-column layout */}
                <div className="mx-auto max-w-[1400px] px-4 sm:px-10 md:px-12 py-6 sm:py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                        {/* Left Column (Sticky Sidebar Header & Metadata) */}
                        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
                            <div className="space-y-4">

                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-clashDisplay text-black leading-[1.15] tracking-tight">
                                    Your privacy & trust matter to us.
                                </h2>

                            </div>


                            {/* Search & Quick Navigation Bar */}
                            <div className="bg-[#F5F5F5] rounded-2xl p-5 border border-neutral-200/80 space-y-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                                    <input
                                        type="text"
                                        placeholder="Search privacy topics..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-neutral-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-all"
                                    />
                                </div>

                                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                                    {policySections.map((sec) => (
                                        <button
                                            key={sec.id}
                                            onClick={() => scrollToSection(sec.id)}
                                            className="w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-white text-neutral-600 hover:text-black font-medium transition-colors flex items-center justify-between group cursor-pointer"
                                        >
                                            <span className="truncate">{sec.title}</span>
                                            <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-black shrink-0 ml-2" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Policy Sections List - Matched with Return & Exchange list style) */}
                        <div className="lg:col-span-7 space-y-10">
                            {filteredSections.length === 0 ? (
                                <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center space-y-2">
                                    <p className="text-sm font-semibold text-black">No matching section found</p>
                                    <p className="text-xs text-neutral-500">Try searching for terms like &quot;profile&quot;, &quot;cookies&quot;, or &quot;QR&quot;.</p>
                                </div>
                            ) : (
                                filteredSections.map((sec) => (
                                    <div
                                        key={sec.id}
                                        id={sec.id}
                                        className="scroll-mt-32 bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-2xs space-y-4 hover:border-neutral-300 transition-colors"
                                    >
                                        <div className="flex items-start gap-4 pb-4 border-b border-neutral-100">
                                            <span className="text-neutral-300 font-bold text-xl sm:text-2xl font-sans tracking-wide shrink-0 pt-0.5">
                                                {sec.number}
                                            </span>
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-lg sm:text-xl text-black font-clashDisplay tracking-tight">
                                                    {sec.title}
                                                </h3>
                                                <p className="text-xs text-neutral-400 font-normal">
                                                    {sec.summary}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2 font-sans">
                                            {sec.content}
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* IMPORTANT NOTE DISCLAIMER BOX - From Page 8 of PDF */}
                            <div className="mt-12 bg-amber-50/90 border border-amber-300/80 p-6 sm:p-8 rounded-2xl space-y-3 text-amber-950 font-sans shadow-2xs">
                                <div className="flex items-center gap-2 text-amber-900 font-semibold font-clashDisplay text-base">
                                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                                    IMPORTANT NOTE
                                </div>
                                <p className="text-xs sm:text-sm leading-relaxed text-amber-900">
                                    This Privacy Policy is intended as a strong operational draft for Bacstory&apos;s website and digital garment ecosystem. Before publishing it, Bacstory should replace the placeholders and have the final version reviewed by an Indian privacy/legal professional, particularly because the Bacstory model involves QR-linked garment profiles, user-generated content, OTP verification, public profiles, and potentially third-party social links.
                                </p>
                                <p className="text-xs text-amber-800/90 pt-1 border-t border-amber-200/80">
                                    The Government of India&apos;s final Digital Personal Data Protection Rules, 2025 were notified on 13 November 2025, with different provisions taking effect according to the notified implementation timeline.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
