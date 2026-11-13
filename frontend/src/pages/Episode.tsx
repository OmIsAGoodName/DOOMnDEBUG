import React from 'react';
import { useParams } from 'react-router-dom';

export default function Episode() {
  const { id } = useParams();
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold text-slate-800">Episode Player</h1>
      <p className="text-slate-600">Playing episode ID: {id} (Owner: Nigel).</p>
    </div>
  );
}

