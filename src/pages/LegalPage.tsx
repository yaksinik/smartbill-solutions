import React from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, RefreshCcw, Mail, ArrowLeft } from 'lucide-react';
import { Link, useLocation, Navigate } from 'react-router-dom';

const LegalLayout = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
    <div className="max-w-3xl mx-auto">
      <Link to="/auth" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-500 transition-colors mb-8 font-bold">
        <ArrowLeft size={20} /> Back to Login
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
            <Icon size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
          {children}
        </div>
      </motion.div>
      
      <div className="mt-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
        © 2026 SmartBill Solutions Pvt Ltd. All rights reserved.
      </div>
    </div>
  </div>
);

export default function LegalPage() {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/privacy') {
    return (
      <LegalLayout title="Privacy Policy" icon={Shield}>
        <p>At SmartBill, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Information Collection</h3>
        <p>We collect information you provide directly to us, such as when you create an account, pay a bill, or contact support. This includes your name, email, phone number, and bill details.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. Use of Information</h3>
        <p>We use your information to provide and improve our services, process payments, and communicate with you about your account and bills.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Data Security</h3>
        <p>We implement industry-standard security measures to protect your data. Payment information is handled securely through verified payment gateways like Razorpay.</p>
      </LegalLayout>
    );
  }

  if (path === '/terms') {
    return (
      <LegalLayout title="Terms & Conditions" icon={FileText}>
        <p>By using SmartBill, you agree to the following terms and conditions. Please read them carefully.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Account Responsibility</h3>
        <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. Payment Services</h3>
        <p>SmartBill facilitates bill payments through third-party providers. We are not responsible for delays or errors caused by utility providers or payment gateways.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Limitation of Liability</h3>
        <p>SmartBill shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services.</p>
      </LegalLayout>
    );
  }

  if (path === '/refund') {
    return (
      <LegalLayout title="Refund Policy" icon={RefreshCcw}>
        <p>Our goal is to ensure a smooth payment experience. Here is our policy regarding refunds and cancellations.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Bill Payments</h3>
        <p>Once a bill payment is successfully processed and confirmed by the utility provider, it cannot be cancelled or refunded through SmartBill.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. Failed Transactions</h3>
        <p>In case of a failed transaction where money is deducted from your account but the bill is not paid, the amount will be automatically refunded to your original payment method within 5-7 business days.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Contact Us</h3>
        <p>For any refund-related queries, please contact us at yaksinik@gmail.com with your transaction ID.</p>
      </LegalLayout>
    );
  }

  if (path === '/contact') {
    return (
      <LegalLayout title="Contact Us" icon={Mail}>
        <p>Have questions or need help? Reach out to our team.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Email Support</h3>
            <p className="text-emerald-500 font-bold">yaksinik@gmail.com</p>
            <p className="text-sm mt-2">We respond within 24 hours.</p>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Phone Support</h3>
            <p className="text-blue-500 font-bold">+91 98765 43210</p>
            <p className="text-sm mt-2">Mon-Fri, 9am - 6pm IST.</p>
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Office Address</h3>
        <p>SmartBill Solutions Pvt Ltd<br />123, Tech Park, Outer Ring Road<br />Bangalore, Karnataka, India - 560001</p>
        <p className="mt-4 text-sm text-slate-500">Registered & Operational Address: Same as above.</p>
      </LegalLayout>
    );
  }

  if (path === '/about') {
    return (
      <LegalLayout title="About Us" icon={FileText}>
        <p>SmartBill is a modern bill management platform designed to simplify how households track and pay their utility bills.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Our Mission</h3>
        <p>Our mission is to provide a transparent, secure, and effortless way for everyone to manage their recurring expenses, ensuring no bill goes unpaid and no late fee is ever charged.</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Why Choose Us?</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Real-time bill tracking and notifications.</li>
          <li>Secure payment integration with trusted partners.</li>
          <li>Comprehensive payment history and receipt management.</li>
          <li>AI-powered support for all your queries.</li>
        </ul>
      </LegalLayout>
    );
  }

  return <Navigate to="/auth" />;
}
