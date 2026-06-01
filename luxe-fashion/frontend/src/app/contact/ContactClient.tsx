'use client';
import { useState } from 'react';
import { contactApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, MapPin, Clock } from 'lucide-react';

export default function ContactClient() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactApi.send(form);
      toast.success("Message sent! We'll respond within 24 hours.");
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-12">
        <p className="label-small text-brand-500 mb-3">Get in Touch</p>
        <h1 className="font-serif text-4xl md:text-5xl font-light text-brand-900 dark:text-white">Contact Us</h1>
        <p className="text-brand-500 text-sm mt-3 max-w-md mx-auto">
          We'd love to hear from you. Our team typically responds within 24 hours.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Info */}
        <div className="space-y-8">
          {[
            { Icon: Mail,  title: 'Email',   detail: 'hello@luxefashion.com', sub: 'We reply within 24 hours' },
            { Icon: MapPin, title: 'Studio',  detail: '123 Fashion Ave, NYC',  sub: 'By appointment only' },
            { Icon: Clock, title: 'Hours',   detail: 'Mon–Fri: 9am–6pm EST',   sub: 'Sat: 10am–4pm EST' },
          ].map(({ Icon, title, detail, sub }) => (
            <div key={title} className="flex gap-4">
              <div className="w-10 h-10 bg-brand-100 dark:bg-brand-800 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-brand-700 dark:text-brand-300" />
              </div>
              <div>
                <p className="font-medium text-sm text-brand-900 dark:text-white mb-0.5">{title}</p>
                <p className="text-sm text-brand-600 dark:text-brand-400">{detail}</p>
                <p className="text-xs text-brand-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label-small block mb-2">Your Name</label>
                <input value={form.name} onChange={set('name')} className="input-field" required />
              </div>
              <div>
                <label className="label-small block mb-2">Email Address</label>
                <input type="email" value={form.email} onChange={set('email')} className="input-field" required />
              </div>
            </div>
            <div>
              <label className="label-small block mb-2">Subject</label>
              <select value={form.subject} onChange={set('subject')}
                className="input-field bg-transparent cursor-pointer">
                <option value="">Select a topic…</option>
                {['Order Enquiry','Returns & Exchanges','Product Question','Sizing Help','Wholesale','Press','Other']
                  .map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label-small block mb-2">Message</label>
              <textarea value={form.message} onChange={set('message')} rows={6}
                className="input-field resize-none" required
                placeholder="Tell us how we can help…" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
