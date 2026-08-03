"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, PhoneCall, RotateCcw, HelpCircle, Send, Check } from "lucide-react";

export default function AccountSupportPage() {
    const [supportSent, setSupportSent] = useState(false);
    const [supportForm, setSupportForm] = useState({
        subject: "Order Status",
        message: "",
    });

    const handleSupportSubmit = (e) => {
        e.preventDefault();
        setSupportSent(true);
        setTimeout(() => {
            setSupportSent(false);
            setSupportForm({ subject: "Order Status", message: "" });
        }, 4000);
    };

    return (
        <div className="space-y-8">
            {/* Support Header */}
            <div className="border-b border-neutral-100 pb-5">
                <h2 className="text-xl sm:text-2xl font-bold font-clashDisplay text-neutral-900">
                    Support & Help Center
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                    Have a question or need assistance with your orders? We're here for you.
                </p>
            </div>

            {/* Contact Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Card */}
                <div className="border border-neutral-200/90 rounded-2xl p-5 bg-white space-y-3 hover:border-neutral-300 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                        <Mail className="w-5 h-5 stroke-[1.6]" />
                    </div>
                    <div>
                        <h4 className="font-bold text-neutral-900 text-sm">Email Support</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">Response within 24 hours</p>
                        <a href="mailto:support@bacstory.com" className="text-xs font-semibold text-neutral-900 hover:underline mt-2 inline-block">
                            support@bacstory.com
                        </a>
                    </div>
                </div>

                {/* Phone/WhatsApp Card */}
                <div className="border border-neutral-200/90 rounded-2xl p-5 bg-white space-y-3 hover:border-neutral-300 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                        <PhoneCall className="w-5 h-5 stroke-[1.6]" />
                    </div>
                    <div>
                        <h4 className="font-bold text-neutral-900 text-sm">Helpline & WhatsApp</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">Mon – Sat: 10:00 AM – 7:00 PM</p>
                        <a href="tel:+919876543210" className="text-xs font-semibold text-neutral-900 hover:underline mt-2 inline-block">
                            +91 98765 43210
                        </a>
                    </div>
                </div>

                {/* Returns & Exchange Card */}
                <div className="border border-neutral-200/90 rounded-2xl p-5 bg-white space-y-3 hover:border-neutral-300 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                        <RotateCcw className="w-5 h-5 stroke-[1.6]" />
                    </div>
                    <div>
                        <h4 className="font-bold text-neutral-900 text-sm">Returns & Exchange</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">30-day easy return window</p>
                        <Link href="/return-and-exchange" className="text-xs font-semibold text-neutral-900 hover:underline mt-2 inline-block">
                            View Return Policy →
                        </Link>
                    </div>
                </div>

                {/* FAQ Guide Card */}
                <div className="border border-neutral-200/90 rounded-2xl p-5 bg-white space-y-3 hover:border-neutral-300 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                        <HelpCircle className="w-5 h-5 stroke-[1.6]" />
                    </div>
                    <div>
                        <h4 className="font-bold text-neutral-900 text-sm">Frequently Asked Questions</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">Instant answers to common queries</p>
                        <Link href="/faq" className="text-xs font-semibold text-neutral-900 hover:underline mt-2 inline-block">
                            Browse FAQs →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Submit Inquiry Form */}
            <div className="pt-4 border-t border-neutral-100">
                <h3 className="text-base font-bold text-neutral-900 mb-4">Send Us a Message</h3>
                {supportSent ? (
                    <div className="bg-neutral-900 text-white rounded-2xl p-6 text-center space-y-2">
                        <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                        <h4 className="font-bold text-base">Inquiry Submitted!</h4>
                        <p className="text-xs text-neutral-300">Thank you for reaching out. Our support team will get back to you shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Subject / Issue</label>
                            <select
                                value={supportForm.subject}
                                onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400 bg-white"
                            >
                                <option value="Order Status">Order Status & Tracking</option>
                                <option value="Return / Exchange">Return or Exchange Request</option>
                                <option value="Payment Issue">Payment / Billing Query</option>
                                <option value="Product Inquiry">Product & Sizing Inquiry</option>
                                <option value="Other">Other Query</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Message</label>
                            <textarea
                                required
                                rows={4}
                                value={supportForm.message}
                                onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                                placeholder="Describe your issue or question..."
                                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400 bg-white resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-neutral-900 text-white rounded-xl px-6 py-2.5 text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Submit Message
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
