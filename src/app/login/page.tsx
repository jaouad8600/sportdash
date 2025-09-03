'use client';
import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await signIn('credentials', { email, password, callbackUrl: '/' });
  }

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 w-full"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">Sign in</button>
      </form>
    </div>
  );
}
