'use client';

export default function AdminTalentsError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-4xl rounded-[28px] border border-red-200 bg-red-50 p-8 text-red-950">
      <h2 className="text-2xl font-black">Não foi possível abrir a gestão de talentos</h2>
      <p className="mt-3">A sessão, a estrutura do banco ou a conexão podem estar indisponíveis.</p>
      <button onClick={reset} className="mt-5 rounded-full bg-red-800 px-5 py-2.5 font-bold text-white">Tentar novamente</button>
    </div>
  );
}

