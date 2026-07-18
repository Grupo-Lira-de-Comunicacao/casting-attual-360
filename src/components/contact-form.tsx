'use client';

import { FormEvent, useState } from 'react';

type ContactFormProps = {
  title: string;
  description: string;
  requestType: 'empresa' | 'talento';
};

export function ContactForm({ title, description, requestType }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const fieldClassName =
    'rounded-2xl border border-slate-300 bg-white px-4 py-3 text-navy caret-blue outline-none placeholder:text-slate-400 transition focus:border-teal focus:ring-2 focus:ring-teal/25';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setStatus('error');
      setMessage('A conexão com o banco ainda não está configurada.');
      return;
    }

    const payload = {
      request_type: requestType,
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      organization: String(formData.get('organization') ?? '').trim(),
      message: String(formData.get('message') ?? '').trim(),
      is_test: true,
    };

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/requests`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      form.reset();
      setStatus('success');
      setMessage('Cadastro de teste enviado com sucesso.');
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setStatus('error');
      setMessage('Não foi possível enviar agora. Verifique a tabela e tente novamente.');
    }
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-soft">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Formulário</p>
        <h2 className="text-2xl font-bold text-navy">{title}</h2>
        <p className="text-slate-600">{description}</p>
      </div>

      <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
        <input className={fieldClassName} name="name" placeholder="Nome" required />
        <input className={fieldClassName} name="email" type="email" placeholder="Email" required />
        <input className={fieldClassName} name="organization" placeholder="Empresa ou talento" required />
        <textarea className={`min-h-28 ${fieldClassName}`} name="message" placeholder="Conteúdo da mensagem" required />
        <button
          className="rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:bg-blue disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Enviando...' : 'Enviar'}
        </button>

        {message && (
          <p
            role="status"
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              status === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-xs text-slate-500">Ambiente de validação: os registros enviados nesta fase são identificados como testes.</p>
      </form>
    </section>
  );
}
