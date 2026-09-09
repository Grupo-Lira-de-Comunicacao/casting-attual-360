'use client';

import Link from 'next/link';
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

  function value(formData: FormData, field: string) {
    return String(formData.get(field) ?? '').trim();
  }

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

    const consent = formData.get('consent') === 'on';
    if (!consent) {
      setStatus('error');
      setMessage('Para enviar, confirme a leitura da Política de Privacidade e autorize o tratamento dos dados informados.');
      return;
    }

    const common = {
      name: value(formData, 'name'),
      email: value(formData, 'email'),
      phone: value(formData, 'phone'),
      city: value(formData, 'city'),
    };

    const details = requestType === 'talento'
      ? [
          `Nome artístico: ${value(formData, 'stage_name') || 'não informado'}`,
          `WhatsApp/telefone: ${common.phone}`,
          `Cidade/região: ${common.city}`,
          `Categoria profissional: ${value(formData, 'category')}`,
          `Instagram/redes: ${value(formData, 'social') || 'não informado'}`,
          `Portfólio/link: ${value(formData, 'portfolio') || 'não informado'}`,
          '',
          'Apresentação e experiência:',
          value(formData, 'details'),
          '',
          'Consentimento LGPD: confirmado no envio.',
        ].join('\n')
      : [
          `Empresa/marca: ${value(formData, 'organization')}`,
          `Responsável: ${value(formData, 'responsible') || common.name}`,
          `WhatsApp/telefone: ${common.phone}`,
          `Cidade/região: ${common.city}`,
          `Tipo de produção/campanha: ${value(formData, 'production_type')}`,
          `Público-alvo: ${value(formData, 'audience') || 'não informado'}`,
          '',
          'Briefing / necessidade:',
          value(formData, 'details'),
          '',
          'Consentimento LGPD: confirmado no envio.',
        ].join('\n');

    const organization = requestType === 'talento'
      ? `${value(formData, 'category')} • ${common.city}`
      : value(formData, 'organization');

    const payload = {
      request_type: requestType,
      name: common.name,
      email: common.email,
      organization,
      message: details,
      is_test: false,
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
      setMessage(
        requestType === 'talento'
          ? 'Cadastro recebido. Nossa equipe poderá entrar em contato para validação e próximos passos.'
          : 'Solicitação recebida. Nossa equipe poderá entrar em contato para entender a campanha e indicar os próximos passos.',
      );
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setStatus('error');
      setMessage('Não foi possível enviar agora. Tente novamente em instantes.');
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
        <div className="grid gap-4 md:grid-cols-2">
          <input className={fieldClassName} name="name" placeholder={requestType === 'talento' ? 'Nome completo' : 'Seu nome'} required maxLength={120} />
          <input className={fieldClassName} name="email" type="email" placeholder="E-mail" required maxLength={180} />
          <input className={fieldClassName} name="phone" type="tel" placeholder="WhatsApp / telefone" required maxLength={40} />
          <input className={fieldClassName} name="city" placeholder="Cidade / região" required maxLength={120} />
        </div>

        {requestType === 'talento' ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={fieldClassName} name="stage_name" placeholder="Nome artístico (opcional)" maxLength={120} />
              <input className={fieldClassName} name="category" placeholder="Categoria profissional" required maxLength={120} />
              <input className={fieldClassName} name="social" placeholder="Instagram / redes sociais" maxLength={240} />
              <input className={fieldClassName} name="portfolio" type="url" placeholder="Link de portfólio (opcional)" maxLength={500} />
            </div>
            <textarea
              className={`min-h-36 ${fieldClassName}`}
              name="details"
              placeholder="Conte sua experiência, principais trabalhos, habilidades, disponibilidade e o que deseja desenvolver no Casting 360."
              required
              maxLength={2200}
            />
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={fieldClassName} name="organization" placeholder="Empresa / marca" required maxLength={180} />
              <input className={fieldClassName} name="responsible" placeholder="Responsável pelo projeto" maxLength={120} />
              <input className={fieldClassName} name="production_type" placeholder="Tipo de produção / campanha" required maxLength={180} />
              <input className={fieldClassName} name="audience" placeholder="Público-alvo (opcional)" maxLength={240} />
            </div>
            <textarea
              className={`min-h-36 ${fieldClassName}`}
              name="details"
              placeholder="Descreva a campanha, perfil de talento procurado, quantidade, datas, local, canais de divulgação e demais informações relevantes."
              required
              maxLength={2200}
            />
          </>
        )}

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[#19c7c5]" />
          <span>
            Li e concordo com a <Link href="/privacidade" className="font-bold text-blue hover:underline">Política de Privacidade</Link> e autorizo o tratamento dos dados enviados para análise, contato e gestão desta solicitação, nos termos da LGPD.
          </span>
        </label>

        <button
          className="rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:bg-blue disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Enviando...' : requestType === 'talento' ? 'Enviar cadastro' : 'Enviar briefing'}
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

        <p className="text-xs text-slate-500">
          Os dados são usados exclusivamente para operar o Casting Attual 360 e atender esta solicitação. Consulte também nossos <Link href="/termos" className="font-semibold text-blue hover:underline">Termos de Uso</Link>.
        </p>
      </form>
    </section>
  );
}
