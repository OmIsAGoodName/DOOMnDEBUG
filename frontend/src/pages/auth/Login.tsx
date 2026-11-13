import React from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Sign In</h1>
      <p className="text-slate-600 text-sm">Auth page placeholder (Owner: Nigel & Om).</p>
      <div className="pt-4">
        <Link to="/" className="text-blue-600 hover:underline text-sm">Continue in Demo Mode &rarr;</Link>
      </div>
    </div>
  );
}

