import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = { title: 'Contact Us — Luxe Fashion' };
export default function ContactPage() { return <ContactClient />; }
