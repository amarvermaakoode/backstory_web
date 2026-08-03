"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import { Mail, PhoneCall, RotateCcw, HelpCircle, Send, Check, Clock } from "lucide-react";

export default function AccountSupportPage() {
    const { user, userFetch } = useUserAuth();
    const { showToast } = useToast();

    const [supportSent, setSupportSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [myTickets, setMyTickets] = useState([]);
    const [supportForm, setSupportForm] = useState({
        subject: "Order Status",
        message: "",
    });

    // Fetch user's submitted tickets
    useEffect(() => {
        let isMounted = true;
        const fetchTickets = async () => {
            try {
                if (userFetch) {
                    const res = await userFetch("/support/my-tickets");
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && Array.isArray(data.data) && isMounted) {
                            setMyTickets(data.data);
                        }
                    }
                }
            } catch (err) {
                console.log("Fetch user support tickets error:", err);
            }
        };

        fetchTickets();

        return () => {
            isMounted = false;
        };
    }, [userFetch]);

    const handleSupportSubmit = async (e) => {
        e.preventDefault();
        if (!supportForm.message) return;

        setSubmitting(true);

        try {
            if (userFetch) {
                const res = await userFetch("/support", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subject: supportForm.subject,
                        message: supportForm.message,
                        name: user?.name || "",
                        email: user?.email || "",
                        phone: user?.phone || user?.phoneNumber || "",
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setMyTickets((prev) => [data.data, ...prev]);
                    }
                }
            }
        } catch (err) {
            console.log("Submit support ticket API error (mock fallback):", err);
        } finally {
            setSubmitting(false);
            setSupportSent(true);
            showToast("Your support ticket has been submitted!", "success");
            setTimeout(() => {
                setSupportSent(false);
                setSupportForm({ subject: "Order Status", message: "" });
            }, 4000);
        }
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
                            disabled={submitting}
                            className="bg-neutral-900 text-white rounded-xl px-6 py-2.5 text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <Send className="w-3.5 h-3.5" />
                            {submitting ? "Submitting..." : "Submit Message"}
                        </button>
                    </form>
                )}
            </div>

            {/* My Submitted Support Tickets Section */}
            {myTickets.length > 0 && (
                <div className="pt-6 border-t border-neutral-100 space-y-4">
                    <h3 className="text-base font-bold text-neutral-900">My Support Tickets</h3>
                    <div className="space-y-3">
                        {myTickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                className="border border-neutral-200/80 rounded-xl p-4 bg-neutral-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs text-neutral-900">{ticket.subject}</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                                            {ticket.status || "Open"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-600 line-clamp-1 mt-1">{ticket.message}</p>
                                </div>
                                <div className="text-[11px] text-neutral-400 font-medium flex items-center gap-1 shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "Just now"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
