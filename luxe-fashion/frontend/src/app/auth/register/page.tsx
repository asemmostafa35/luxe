// Register is handled on the login page (toggle between login/register modes)
// This redirect ensures /auth/register works as a URL
import { redirect } from 'next/navigation';
export default function RegisterPage() {
  redirect('/auth/login?mode=register');
}
