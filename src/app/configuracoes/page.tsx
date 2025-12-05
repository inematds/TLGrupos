'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Download,
  ExternalLink,
  Link as LinkIcon,
  Mail,
  DollarSign,
  FileText,
  Bot,
  Info,
  Bell
} from 'lucide-react';

type Tab = 'geral' | 'cadastro' | 'pagamento' | 'email' | 'bot' | 'notificacoes' | 'noticias';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Configurações de Cadastro
  const [cadastroUrl, setCadastroUrl] = useState('');
  const [cadastroExterno, setCadastroExterno] = useState(false);
  const [cadastroTitulo, setCadastroTitulo] = useState('');
  const [cadastroSubtitulo, setCadastroSubtitulo] = useState('');
  const [cadastroInfoTitulo, setCadastroInfoTitulo] = useState('');
  const [cadastroInfoTexto, setCadastroInfoTexto] = useState('');
  const [cadastroAvisoTitulo, setCadastroAvisoTitulo] = useState('');
  const [cadastroAvisoTexto, setCadastroAvisoTexto] = useState('');

  // Configurações de Pagamento
  const [paymentPixUrl, setPaymentPixUrl] = useState('');
  const [paymentExterno, setPaymentExterno] = useState(false);
  const [paymentPixTitulo, setPaymentPixTitulo] = useState('');
  const [paymentPixSubtitulo, setPaymentPixSubtitulo] = useState('');
  const [paymentPixInstrucoes, setPaymentPixInstrucoes] = useState('');
  const [chavePixGlobal, setChavePixGlobal] = useState('');

  // Configurações de Email
  const [emailProvider, setEmailProvider] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');

  // Configurações do Bot
  const [botWebhookUrl, setBotWebhookUrl] = useState('');
  const [botGrupoPrincipal, setBotGrupoPrincipal] = useState('-1002242190548');
  const [telegramGroups, setTelegramGroups] = useState<any[]>([]);
  const [botAutoCadastroEntrar, setBotAutoCadastroEntrar] = useState(true);
  const [botAutoCadastroMensagem, setBotAutoCadastroMensagem] = useState(true);
  const [botComandoRegistrar, setBotComandoRegistrar] = useState(true);
  const [botMensagemBoasVindas, setBotMensagemBoasVindas] = useState('');

  // Configurações de Remoção Automática
  const [botRemocaoAutomatica, setBotRemocaoAutomatica] = useState(true);
  const [botHorarioRemocao, setBotHorarioRemocao] = useState('03:00');

  // Configurações de Notificações
  const [notifVencimentoAtivo, setNotifVencimentoAtivo] = useState(true);
  const [notifVencimento1Ativo, setNotifVencimento1Ativo] = useState(true);
  const [notifVencimento1Dias, setNotifVencimento1Dias] = useState('5');
  const [notifVencimento2Ativo, setNotifVencimento2Ativo] = useState(false);
  const [notifVencimento2Dias, setNotifVencimento2Dias] = useState('7');
  const [notifVencimento3Ativo, setNotifVencimento3Ativo] = useState(false);
  const [notifVencimento3Dias, setNotifVencimento3Dias] = useState('30');
  const [notifEnviarTelegram, setNotifEnviarTelegram] = useState(true);
  const [notifEnviarEmail, setNotifEnviarEmail] = useState(true);
  const [notifMensagemVencimento, setNotifMensagemVencimento] = useState('');
  const [notifNoticiasAtivo, setNotifNoticiasAtivo] = useState(true);
  const [notifNoticiasTelegram, setNotifNoticiasTelegram] = useState(true);
  const [notifNoticiasEmail, setNotifNoticiasEmail] = useState(false);
  const [notifTituloNoticias, setNotifTituloNoticias] = useState('');
  const [notifTextoNoticias, setNotifTextoNoticias] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // Cadastro configs
        const urlConfig = data.data.find((c: any) => c.chave === 'cadastro_url');
        const externoConfig = data.data.find((c: any) => c.chave === 'cadastro_externo');
        const tituloConfig = data.data.find((c: any) => c.chave === 'cadastro_titulo');
        const subtituloConfig = data.data.find((c: any) => c.chave === 'cadastro_subtitulo');
        const infoTituloConfig = data.data.find((c: any) => c.chave === 'cadastro_info_titulo');
        const infoTextoConfig = data.data.find((c: any) => c.chave === 'cadastro_info_texto');
        const avisoTituloConfig = data.data.find((c: any) => c.chave === 'cadastro_aviso_titulo');
        const avisoTextoConfig = data.data.find((c: any) => c.chave === 'cadastro_aviso_texto');

        // Payment configs
        const paymentPixUrlConfig = data.data.find((c: any) => c.chave === 'payment_pix_url');
        const paymentExternoConfig = data.data.find((c: any) => c.chave === 'payment_externo');
        const paymentPixTituloConfig = data.data.find((c: any) => c.chave === 'payment_pix_titulo');
        const paymentPixSubtituloConfig = data.data.find((c: any) => c.chave === 'payment_pix_subtitulo');
        const paymentPixInstrucoesConfig = data.data.find((c: any) => c.chave === 'payment_pix_instrucoes');
        const chavePixGlobalConfig = data.data.find((c: any) => c.chave === 'chave_pix_global');

        // Email configs
        const emailProviderConfig = data.data.find((c: any) => c.chave === 'email_provider');
        const emailFromConfig = data.data.find((c: any) => c.chave === 'email_from');
        const gmailUserConfig = data.data.find((c: any) => c.chave === 'gmail_user');
        const gmailAppPasswordConfig = data.data.find((c: any) => c.chave === 'gmail_app_password');

        if (urlConfig) setCadastroUrl(urlConfig.valor);
        if (externoConfig) setCadastroExterno(externoConfig.valor === 'true');
        if (tituloConfig) setCadastroTitulo(tituloConfig.valor);
        if (subtituloConfig) setCadastroSubtitulo(subtituloConfig.valor);
        if (infoTituloConfig) setCadastroInfoTitulo(infoTituloConfig.valor);
        if (infoTextoConfig) setCadastroInfoTexto(infoTextoConfig.valor);
        if (avisoTituloConfig) setCadastroAvisoTitulo(avisoTituloConfig.valor);
        if (avisoTextoConfig) setCadastroAvisoTexto(avisoTextoConfig.valor);

        if (paymentPixUrlConfig) setPaymentPixUrl(paymentPixUrlConfig.valor);
        if (paymentExternoConfig) setPaymentExterno(paymentExternoConfig.valor === 'true');
        if (paymentPixTituloConfig) setPaymentPixTitulo(paymentPixTituloConfig.valor);
        if (paymentPixSubtituloConfig) setPaymentPixSubtitulo(paymentPixSubtituloConfig.valor);
        if (paymentPixInstrucoesConfig) setPaymentPixInstrucoes(paymentPixInstrucoesConfig.valor);
        if (chavePixGlobalConfig) setChavePixGlobal(chavePixGlobalConfig.valor);

        if (emailProviderConfig) setEmailProvider(emailProviderConfig.valor);
        if (emailFromConfig) setEmailFrom(emailFromConfig.valor);
        if (gmailUserConfig) setGmailUser(gmailUserConfig.valor);
        if (gmailAppPasswordConfig) setGmailAppPassword(gmailAppPasswordConfig.valor);

        // Bot configs
        const botWebhookUrlConfig = data.data.find((c: any) => c.chave === 'bot_webhook_url');
        const botGrupoPrincipalConfig = data.data.find((c: any) => c.chave === 'bot_grupo_principal');
        const botAutoCadastroEntrarConfig = data.data.find((c: any) => c.chave === 'bot_auto_cadastro_entrar');
        const botAutoCadastroMensagemConfig = data.data.find((c: any) => c.chave === 'bot_auto_cadastro_mensagem');
        const botComandoRegistrarConfig = data.data.find((c: any) => c.chave === 'bot_comando_registrar');
        const botMensagemBoasVindasConfig = data.data.find((c: any) => c.chave === 'bot_mensagem_boas_vindas');
        const botRemocaoAutomaticaConfig = data.data.find((c: any) => c.chave === 'bot_remocao_automatica');
        const botHorarioRemocaoConfig = data.data.find((c: any) => c.chave === 'bot_horario_remocao');

        if (botWebhookUrlConfig) setBotWebhookUrl(botWebhookUrlConfig.valor);
        if (botGrupoPrincipalConfig) setBotGrupoPrincipal(botGrupoPrincipalConfig.valor);
        if (botAutoCadastroEntrarConfig) setBotAutoCadastroEntrar(botAutoCadastroEntrarConfig.valor === 'true');
        if (botAutoCadastroMensagemConfig) setBotAutoCadastroMensagem(botAutoCadastroMensagemConfig.valor === 'true');
        if (botComandoRegistrarConfig) setBotComandoRegistrar(botComandoRegistrarConfig.valor === 'true');
        if (botMensagemBoasVindasConfig) setBotMensagemBoasVindas(botMensagemBoasVindasConfig.valor);
        if (botRemocaoAutomaticaConfig) setBotRemocaoAutomatica(botRemocaoAutomaticaConfig.valor === 'true');
        if (botHorarioRemocaoConfig) setBotHorarioRemocao(botHorarioRemocaoConfig.valor);

        // Log das configs de bot carregadas
        console.log('📥 [Configurações] Auto-cadastro carregado do banco:', {
          botAutoCadastroEntrar: {
            raw: botAutoCadastroEntrarConfig?.valor,
            converted: botAutoCadastroEntrarConfig?.valor === 'true',
          },
          botAutoCadastroMensagem: {
            raw: botAutoCadastroMensagemConfig?.valor,
            converted: botAutoCadastroMensagemConfig?.valor === 'true',
          },
          botComandoRegistrar: {
            raw: botComandoRegistrarConfig?.valor,
            converted: botComandoRegistrarConfig?.valor === 'true',
          }
        });

        // Notificações configs
        const notifVencimentoAtivoConfig = data.data.find((c: any) => c.chave === 'notif_vencimento_ativo');
        const notifVencimento1AtivoConfig = data.data.find((c: any) => c.chave === 'notif_vencimento_1_ativo');
        const notifVencimento1DiasConfig = data.data.find((c: any) => c.chave === 'notif_vencimento_1_dias');
        const notifVencimento2AtivoConfig = data.data.find((c: any) => c.chave === 'notif_vencimento_2_ativo');
        const notifVencimento2DiasConfig = data.data.find((c: any) => c.chave === 'notif_vencimento_2_dias');
        const notifVencimento3AtivoConfig = data.data.find((c: any) => c.chave === 'notif_vencimento_3_ativo');
        const notifVencimento3DiasConfig = data.data.find((c: any) => c.chave === 'notif_vencimento_3_dias');
        const notifEnviarTelegramConfig = data.data.find((c: any) => c.chave === 'notif_enviar_telegram');
        const notifEnviarEmailConfig = data.data.find((c: any) => c.chave === 'notif_enviar_email');
        const notifMensagemVencimentoConfig = data.data.find((c: any) => c.chave === 'notif_mensagem_vencimento');
        const notifNoticiasAtivoConfig = data.data.find((c: any) => c.chave === 'notif_noticias_ativo');
        const notifNoticiasTelegramConfig = data.data.find((c: any) => c.chave === 'notif_noticias_telegram');
        const notifNoticiasEmailConfig = data.data.find((c: any) => c.chave === 'notif_noticias_email');
        const notifTituloNoticiasConfig = data.data.find((c: any) => c.chave === 'notif_titulo_noticias');
        const notifTextoNoticiasConfig = data.data.find((c: any) => c.chave === 'notif_texto_noticias');

        if (notifVencimentoAtivoConfig) setNotifVencimentoAtivo(notifVencimentoAtivoConfig.valor === 'true');
        if (notifVencimento1AtivoConfig) setNotifVencimento1Ativo(notifVencimento1AtivoConfig.valor === 'true');
        if (notifVencimento1DiasConfig) setNotifVencimento1Dias(notifVencimento1DiasConfig.valor);
        if (notifVencimento2AtivoConfig) setNotifVencimento2Ativo(notifVencimento2AtivoConfig.valor === 'true');
        if (notifVencimento2DiasConfig) setNotifVencimento2Dias(notifVencimento2DiasConfig.valor);
        if (notifVencimento3AtivoConfig) setNotifVencimento3Ativo(notifVencimento3AtivoConfig.valor === 'true');
        if (notifVencimento3DiasConfig) setNotifVencimento3Dias(notifVencimento3DiasConfig.valor);
        if (notifEnviarTelegramConfig) setNotifEnviarTelegram(notifEnviarTelegramConfig.valor === 'true');
        if (notifEnviarEmailConfig) setNotifEnviarEmail(notifEnviarEmailConfig.valor === 'true');
        if (notifMensagemVencimentoConfig) setNotifMensagemVencimento(notifMensagemVencimentoConfig.valor);
        if (notifNoticiasAtivoConfig) setNotifNoticiasAtivo(notifNoticiasAtivoConfig.valor === 'true');
        if (notifNoticiasTelegramConfig) setNotifNoticiasTelegram(notifNoticiasTelegramConfig.valor === 'true');
        if (notifNoticiasEmailConfig) setNotifNoticiasEmail(notifNoticiasEmailConfig.valor === 'true');
        if (notifTituloNoticiasConfig) setNotifTituloNoticias(notifTituloNoticiasConfig.valor);
        if (notifTextoNoticiasConfig) setNotifTextoNoticias(notifTextoNoticiasConfig.valor);

        // Log das configs de notícias carregadas
        console.log('📥 [Configurações] Notícias carregadas do banco:', {
          notifNoticiasAtivo: notifNoticiasAtivoConfig?.valor,
          notifNoticiasTelegram: notifNoticiasTelegramConfig?.valor,
          notifNoticiasEmail: notifNoticiasEmailConfig?.valor,
          convertidos: {
            notifNoticiasAtivo: notifNoticiasAtivoConfig?.valor === 'true',
            notifNoticiasTelegram: notifNoticiasTelegramConfig?.valor === 'true',
            notifNoticiasEmail: notifNoticiasEmailConfig?.valor === 'true',
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveConfigs = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const configs = [
        { chave: 'cadastro_url', valor: cadastroUrl },
        { chave: 'cadastro_externo', valor: cadastroExterno.toString() },
        { chave: 'cadastro_titulo', valor: cadastroTitulo },
        { chave: 'cadastro_subtitulo', valor: cadastroSubtitulo },
        { chave: 'cadastro_info_titulo', valor: cadastroInfoTitulo },
        { chave: 'cadastro_info_texto', valor: cadastroInfoTexto },
        { chave: 'cadastro_aviso_titulo', valor: cadastroAvisoTitulo },
        { chave: 'cadastro_aviso_texto', valor: cadastroAvisoTexto },
        { chave: 'payment_pix_url', valor: paymentPixUrl },
        { chave: 'payment_externo', valor: paymentExterno.toString() },
        { chave: 'payment_pix_titulo', valor: paymentPixTitulo },
        { chave: 'payment_pix_subtitulo', valor: paymentPixSubtitulo },
        { chave: 'payment_pix_instrucoes', valor: paymentPixInstrucoes },
        { chave: 'chave_pix_global', valor: chavePixGlobal },
        { chave: 'email_provider', valor: emailProvider },
        { chave: 'email_from', valor: emailFrom },
        { chave: 'gmail_user', valor: gmailUser },
        { chave: 'gmail_app_password', valor: gmailAppPassword },
        { chave: 'bot_webhook_url', valor: botWebhookUrl },
        { chave: 'bot_grupo_principal', valor: botGrupoPrincipal },
        { chave: 'bot_auto_cadastro_entrar', valor: botAutoCadastroEntrar.toString() },
        { chave: 'bot_auto_cadastro_mensagem', valor: botAutoCadastroMensagem.toString() },
        { chave: 'bot_comando_registrar', valor: botComandoRegistrar.toString() },
        { chave: 'bot_mensagem_boas_vindas', valor: botMensagemBoasVindas },
        { chave: 'bot_remocao_automatica', valor: botRemocaoAutomatica.toString() },
        { chave: 'bot_horario_remocao', valor: botHorarioRemocao },
        { chave: 'notif_vencimento_ativo', valor: notifVencimentoAtivo.toString() },
        { chave: 'notif_vencimento_1_ativo', valor: notifVencimento1Ativo.toString() },
        { chave: 'notif_vencimento_1_dias', valor: notifVencimento1Dias },
        { chave: 'notif_vencimento_2_ativo', valor: notifVencimento2Ativo.toString() },
        { chave: 'notif_vencimento_2_dias', valor: notifVencimento2Dias },
        { chave: 'notif_vencimento_3_ativo', valor: notifVencimento3Ativo.toString() },
        { chave: 'notif_vencimento_3_dias', valor: notifVencimento3Dias },
        { chave: 'notif_enviar_telegram', valor: notifEnviarTelegram.toString() },
        { chave: 'notif_enviar_email', valor: notifEnviarEmail.toString() },
        { chave: 'notif_mensagem_vencimento', valor: notifMensagemVencimento },
        { chave: 'notif_noticias_ativo', valor: notifNoticiasAtivo.toString() },
        { chave: 'notif_noticias_telegram', valor: notifNoticiasTelegram.toString() },
        { chave: 'notif_noticias_email', valor: notifNoticiasEmail.toString() },
        { chave: 'notif_titulo_noticias', valor: notifTituloNoticias },
        { chave: 'notif_texto_noticias', valor: notifTextoNoticias },
      ];

      console.log('💾 [Configurações] Salvando configs:', {
        notifNoticiasAtivo,
        notifNoticiasTelegram,
        notifNoticiasEmail,
      });

      const promises = configs.map(config =>
        fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every(r => r.ok);

      if (allOk) {
        console.log('✅ [Configurações] Todas configurações salvas com sucesso!');
        setMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
        // Recarregar configurações para confirmar que foram salvas
        await loadConfigs();
      } else {
        // Identificar quais falharam
        const failedResponses = await Promise.all(
          responses.map(async (r, i) => {
            if (!r.ok) {
              try {
                const contentType = r.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                  const error = await r.json();
                  return { config: configs[i], error };
                } else {
                  const text = await r.text();
                  console.error('❌ [Configurações] Resposta não-JSON:', text.substring(0, 200));
                  return { config: configs[i], error: { message: 'Erro no servidor (resposta HTML)' } };
                }
              } catch (e) {
                return { config: configs[i], error: { message: 'Erro ao processar resposta' } };
              }
            }
            return null;
          })
        );
        const failures = failedResponses.filter(f => f !== null);
        console.error('❌ [Configurações] Erros ao salvar:', failures);
        throw new Error('Erro ao salvar algumas configurações');
      }
    } catch (error: any) {
      console.error('❌ [Configurações] Erro geral ao salvar:', error);
      setMessage({ text: error.message || 'Erro ao salvar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const downloadCadastroHtml = async () => {
    try {
      const response = await fetch('/api/generate-cadastro-html');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cadastro.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage({ text: 'Arquivo cadastro.html baixado com sucesso!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Erro ao baixar arquivo', type: 'error' });
    }
  };

  const downloadPaymentPixHtml = async () => {
    try {
      const response = await fetch('/api/generate-payment-pix-html');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payment-pix.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage({ text: 'Arquivo payment-pix.html baixado com sucesso!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Erro ao baixar arquivo', type: 'error' });
    }
  };

  const tabs = [
    { id: 'geral' as Tab, name: 'Geral', icon: Settings },
    { id: 'cadastro' as Tab, name: 'Cadastro', icon: FileText },
    { id: 'pagamento' as Tab, name: 'Pagamento', icon: DollarSign },
    { id: 'email' as Tab, name: 'Email', icon: Mail },
    { id: 'bot' as Tab, name: 'Bot', icon: Bot },
    { id: 'notificacoes' as Tab, name: 'Notificações', icon: Bell },
    { id: 'noticias' as Tab, name: 'Notícias e Avisos', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie as configurações do sistema</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8">
          <div className="flex gap-1 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-5xl">
        {/* Mensagem de feedback */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Conteúdo das Tabs */}
        {activeTab === 'geral' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Informações do Sistema</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Versão:</span>
                  <span className="font-mono text-gray-900">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Banco de Dados:</span>
                  <span className="font-mono text-gray-900">Supabase</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bot Status:</span>
                  <span className="text-green-600 font-semibold">✅ Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bot Username:</span>
                  <span className="font-mono text-gray-900">@INEMATLGrupobot</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Configurações Padrão</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias de Vencimento Padrão
                  </label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tempo padrão de acesso para novos membros
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cadastro' && (
          <div className="space-y-6">
            {/* URL do Cadastro */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">URL do Formulário de Cadastro</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Completa do Cadastro
                  </label>
                  <input
                    type="url"
                    value={cadastroUrl}
                    onChange={(e) => setCadastroUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="http://157.180.72.42/cadastro.html"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta URL será enviada pelo bot do Telegram no comando /cadastro
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Usar URL Externa</h3>
                    <p className="text-sm text-gray-600">
                      Se ativado, usa a URL acima. Se desativado, usa /cadastro do sistema
                    </p>
                  </div>
                  <button
                    onClick={() => setCadastroExterno(!cadastroExterno)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${cadastroExterno ? 'bg-green-600' : 'bg-gray-400'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${cadastroExterno ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadCadastroHtml}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Baixar cadastro.html
                  </button>

                  {cadastroUrl && (
                    <a
                      href={cadastroUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Testar URL
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Textos do Formulário */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Textos do Formulário</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título Principal
                    </label>
                    <input
                      type="text"
                      value={cadastroTitulo}
                      onChange={(e) => setCadastroTitulo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="📝 Cadastro de Membro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={cadastroSubtitulo}
                      onChange={(e) => setCadastroSubtitulo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Preencha seus dados para se cadastrar"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Caixa de Informações
                  </label>
                  <input
                    type="text"
                    value={cadastroInfoTitulo}
                    onChange={(e) => setCadastroInfoTitulo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ℹ️ Como Funciona o Sistema"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto Informativo
                  </label>
                  <textarea
                    value={cadastroInfoTexto}
                    onChange={(e) => setCadastroInfoTexto(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    placeholder="Acesso Multi-Grupo: Ao se cadastrar..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Aviso de Renovação
                  </label>
                  <input
                    type="text"
                    value={cadastroAvisoTitulo}
                    onChange={(e) => setCadastroAvisoTitulo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="⚠️ Importante - Gerenciamento de Acesso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto do Aviso de Renovação
                  </label>
                  <textarea
                    value={cadastroAvisoTexto}
                    onChange={(e) => setCadastroAvisoTexto(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    placeholder="• Seu acesso possui uma data de vencimento..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pagamento' && (
          <div className="space-y-6">
            {/* Chave PIX Global */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-900">Chave PIX Global</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX Padrão do Sistema
                  </label>
                  <input
                    type="text"
                    value={chavePixGlobal}
                    onChange={(e) => setChavePixGlobal(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemplo.com, CPF, telefone ou chave aleatória"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta chave será usada quando um plano não tiver chave PIX específica configurada
                  </p>
                </div>
              </div>
            </div>

            {/* URLs de Pagamento PIX */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">URLs de Pagamento PIX</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Página de Pagamento PIX
                  </label>
                  <input
                    type="url"
                    value={paymentPixUrl}
                    onChange={(e) => setPaymentPixUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://seusite.com/payment-pix.html"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Usar URL Externa</h3>
                    <p className="text-sm text-gray-600">
                      Se ativado, usa a URL acima. Se desativado, usa página interna do sistema
                    </p>
                  </div>
                  <button
                    onClick={() => setPaymentExterno(!paymentExterno)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${paymentExterno ? 'bg-green-600' : 'bg-gray-400'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${paymentExterno ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={paymentPixTitulo}
                    onChange={(e) => setPaymentPixTitulo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="💰 Pagamento via PIX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={paymentPixSubtitulo}
                    onChange={(e) => setPaymentPixSubtitulo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Faça o pagamento e envie o comprovante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instruções
                  </label>
                  <textarea
                    value={paymentPixInstrucoes}
                    onChange={(e) => setPaymentPixInstrucoes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    placeholder="1️⃣ Copie a chave PIX abaixo..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadPaymentPixHtml}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Baixar payment-pix.html
                  </button>

                  {paymentPixUrl && (
                    <a
                      href={paymentPixUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 flex items-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Testar URL
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Configurações de Email</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provedor de Email
                  </label>
                  <select
                    value={emailProvider}
                    onChange={(e) => setEmailProvider(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione o provedor</option>
                    <option value="gmail">Gmail (SMTP)</option>
                    <option value="resend">Resend</option>
                    <option value="sendgrid">SendGrid</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Escolha o serviço que você usará para enviar emails
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email do Remetente
                  </label>
                  <input
                    type="email"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="seuemail@gmail.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este email aparecerá como remetente nas mensagens enviadas
                  </p>
                </div>

                {emailProvider === 'gmail' && (
                  <>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <p className="text-sm text-blue-800">
                        <strong>📱 Para usar Gmail:</strong>
                      </p>
                      <ol className="text-sm text-blue-800 mt-2 ml-4 list-decimal space-y-1">
                        <li>Ative a verificação em 2 etapas na sua conta Google</li>
                        <li>Acesse: <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline font-medium">Senhas de App</a></li>
                        <li>Crie uma senha de app para "Outro (nome personalizado)"</li>
                        <li>Copie a senha de 16 caracteres e cole abaixo</li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email/Usuário Gmail
                      </label>
                      <input
                        type="email"
                        value={gmailUser}
                        onChange={(e) => setGmailUser(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="seuemail@gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Senha de App Gmail (16 caracteres)
                      </label>
                      <input
                        type="password"
                        value={gmailAppPassword}
                        onChange={(e) => setGmailAppPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                        placeholder="xxxx xxxx xxxx xxxx"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ⚠️ Use a senha de app gerada, NÃO a senha normal do Gmail
                      </p>
                    </div>
                  </>
                )}

                {emailProvider && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <p className="text-sm text-green-800">
                      ✅ <strong>Provedor selecionado:</strong> {emailProvider === 'gmail' ? 'Gmail SMTP' : emailProvider === 'resend' ? 'Resend' : 'SendGrid'}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Clique em "Salvar Alterações" abaixo para ativar o envio de emails
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="space-y-6">
            {/* Informações do Bot */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm border border-blue-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Informações do Bot Telegram</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Token do Bot</p>
                  <p className="text-sm font-mono text-gray-900">8211881890:AAFFqoAo...</p>
                  <p className="text-xs text-gray-500 mt-1">Configurado em .env.local</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Grupos Ativos</p>
                  <p className="text-2xl font-bold text-green-600">7</p>
                  <p className="text-xs text-gray-500 mt-1">Bot operando normalmente</p>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Sistema de Convites:</strong> Os links de acesso serão gerados apenas para o <strong>grupo principal</strong>.
                  O bot continuará cadastrando membros em todos os 7 grupos automaticamente.
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Webhook
                </label>
                <input
                  type="url"
                  value={botWebhookUrl}
                  onChange={(e) => setBotWebhookUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://seudominio.com/api/telegram/webhook"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL pública onde o bot receberá atualizações do Telegram
                </p>
              </div>
            </div>

            {/* Grupos do Telegram */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Configuração de Grupos</h2>

              <div className="space-y-4">
                {/* Grupo Principal */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm font-bold text-green-900">GRUPO PRINCIPAL</p>
                    </div>
                    <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                      CONVITES ATIVOS
                    </span>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-green-900 mb-1">
                      ID do Grupo (para geração de convites)
                    </label>
                    <input
                      type="text"
                      value={botGrupoPrincipal}
                      onChange={(e) => setBotGrupoPrincipal(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-green-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="-1002242190548"
                    />
                    <p className="text-xs text-green-700 mt-1">
                      ℹ️ Digite o ID do grupo do Telegram (com o sinal de menos). Exemplo: -1002242190548
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-50 p-3 rounded border border-green-300">
                    <p className="text-xs text-green-700 mb-1">
                      ✅ Todos os links de acesso pagos serão gerados para este grupo
                    </p>
                    <p className="text-xs text-green-700">
                      ✅ Auto-cadastro ativo para novos membros
                    </p>
                  </div>
                </div>

                {/* Outros Grupos */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Outros Grupos (Auto-cadastro apenas)</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      6 grupos
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs font-mono text-gray-600">-1002466217981</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs font-mono text-gray-600">-1002286953019</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs font-mono text-gray-600">-1002315381358</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs font-mono text-gray-600">-1002414487357</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs font-mono text-gray-600">-1002307181433</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs font-mono text-gray-600">-1002475673809</p>
                    </div>
                  </div>
                  <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                    <p className="text-xs text-blue-800">
                      <strong>ℹ️ Funcionamento:</strong> Estes grupos continuam com cadastro automático de novos membros, mas não receberão links de convite pagos (apenas o grupo principal recebe).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Cadastro */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Auto-Cadastro de Membros</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Auto-Cadastro ao Entrar</h3>
                    <p className="text-sm text-gray-600">
                      Cadastra automaticamente quando alguém entra no grupo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBotAutoCadastroEntrar(!botAutoCadastroEntrar)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      botAutoCadastroEntrar ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        botAutoCadastroEntrar ? 'right-1' : 'left-1'
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Auto-Cadastro por Mensagem</h3>
                    <p className="text-sm text-gray-600">
                      Cadastra quando membro envia primeira mensagem no grupo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBotAutoCadastroMensagem(!botAutoCadastroMensagem)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      botAutoCadastroMensagem ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        botAutoCadastroMensagem ? 'right-1' : 'left-1'
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Comando /registrar</h3>
                    <p className="text-sm text-gray-600">
                      Permite cadastro voluntário via comando no grupo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBotComandoRegistrar(!botComandoRegistrar)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      botComandoRegistrar ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        botComandoRegistrar ? 'right-1' : 'left-1'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Mensagens Automáticas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Mensagens Automáticas</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Boas-Vindas
                  </label>
                  <textarea
                    value={botMensagemBoasVindas}
                    onChange={(e) => setBotMensagemBoasVindas(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Olá {nome}! Bem-vindo(a) ao grupo VIP! 🎉"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {'{nome}'} para incluir o nome do membro. Deixe em branco para desativar.
                  </p>
                </div>
              </div>
            </div>

            {/* Remoção Automática */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Remoção Automática de Membros Vencidos</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Ativar Remoção Automática</h3>
                    <p className="text-sm text-gray-600">
                      Remove automaticamente membros com acesso vencido dos grupos do Telegram
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBotRemocaoAutomatica(!botRemocaoAutomatica)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      botRemocaoAutomatica ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        botRemocaoAutomatica ? 'right-1' : 'left-1'
                      }`}
                    ></div>
                  </button>
                </div>

                {botRemocaoAutomatica && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário de Execução Diária
                    </label>
                    <input
                      type="time"
                      value={botHorarioRemocao}
                      onChange={(e) => setBotHorarioRemocao(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      A remoção automática será executada diariamente neste horário (fuso horário do servidor)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notificacoes' && (
          <div className="space-y-6">
            {/* Notificações de Vencimento */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">Notificações de Vencimento</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Ativar Notificações de Vencimento</h3>
                    <p className="text-sm text-gray-600">
                      Envia mensagem privada no Telegram antes do acesso expirar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifVencimentoAtivo(!notifVencimentoAtivo)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notifVencimentoAtivo ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notifVencimentoAtivo ? 'right-1' : 'left-1'
                      }`}
                    ></div>
                  </button>
                </div>

                {notifVencimentoAtivo && (
                  <>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <p className="text-sm text-blue-800">
                        <strong>📧 📱 Envio Automático:</strong> As notificações de vencimento são enviadas automaticamente via Telegram E Email
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Quando Enviar Avisos (selecione uma ou mais opções e configure os dias)
                      </label>
                      <div className="space-y-3">
                        {/* Opção 1 */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => setNotifVencimento1Ativo(!notifVencimento1Ativo)}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              notifVencimento1Ativo ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                notifVencimento1Ativo ? 'right-1' : 'left-1'
                              }`}
                            ></div>
                          </button>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={notifVencimento1Dias}
                              onChange={(e) => setNotifVencimento1Dias(e.target.value)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center font-semibold"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">dias antes do vencimento</h4>
                              <p className="text-sm text-gray-600">Primeira notificação</p>
                            </div>
                          </div>
                        </div>

                        {/* Opção 2 */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => setNotifVencimento2Ativo(!notifVencimento2Ativo)}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              notifVencimento2Ativo ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                notifVencimento2Ativo ? 'right-1' : 'left-1'
                              }`}
                            ></div>
                          </button>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={notifVencimento2Dias}
                              onChange={(e) => setNotifVencimento2Dias(e.target.value)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center font-semibold"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">dias antes do vencimento</h4>
                              <p className="text-sm text-gray-600">Segunda notificação</p>
                            </div>
                          </div>
                        </div>

                        {/* Opção 3 */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => setNotifVencimento3Ativo(!notifVencimento3Ativo)}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              notifVencimento3Ativo ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                notifVencimento3Ativo ? 'right-1' : 'left-1'
                              }`}
                            ></div>
                          </button>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={notifVencimento3Dias}
                              onChange={(e) => setNotifVencimento3Dias(e.target.value)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center font-semibold"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">dias antes do vencimento</h4>
                              <p className="text-sm text-gray-600">Terceira notificação</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Canais de Envio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Canais de Envio das Notificações
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Toggle Telegram */}
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <button
                            type="button"
                            onClick={() => setNotifEnviarTelegram(!notifEnviarTelegram)}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              notifEnviarTelegram ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              notifEnviarTelegram ? 'right-1' : 'left-1'
                            }`}></div>
                          </button>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">Enviar via Telegram</h4>
                            <p className="text-xs text-gray-600">Mensagens diretas no Telegram</p>
                          </div>
                        </div>

                        {/* Toggle Email */}
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                          <button
                            type="button"
                            onClick={() => setNotifEnviarEmail(!notifEnviarEmail)}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              notifEnviarEmail ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              notifEnviarEmail ? 'right-1' : 'left-1'
                            }`}></div>
                          </button>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">Enviar via Email</h4>
                            <p className="text-xs text-gray-600">Notificações por email</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Você pode ativar um ou ambos os canais de envio
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensagem de Aviso de Vencimento
                      </label>
                      <textarea
                        value={notifMensagemVencimento}
                        onChange={(e) => setNotifMensagemVencimento(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Olá {nome}! Seu acesso ao grupo VIP irá expirar em {dias} dias. Renove para continuar aproveitando o conteúdo exclusivo!"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use {'{nome}'} para o nome do membro e {'{dias}'} para os dias restantes
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'noticias' && (
          <div className="space-y-6">
            {/* Notícias e Avisos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Notícias e Avisos</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Configure mensagens de avisos e novidades para enviar aos membros
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Exibir Seção de Notícias</h3>
                    <p className="text-sm text-gray-600">
                      Mostra avisos e novidades no menu lateral
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifNoticiasAtivo(!notifNoticiasAtivo)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notifNoticiasAtivo ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notifNoticiasAtivo ? 'right-1' : 'left-1'
                      }`}
                    ></div>
                  </button>
                </div>

                {notifNoticiasAtivo && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Canais de Envio (pode ativar um ou ambos)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Toggle Telegram */}
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <button
                            type="button"
                            onClick={() => setNotifNoticiasTelegram(!notifNoticiasTelegram)}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              notifNoticiasTelegram ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              notifNoticiasTelegram ? 'right-1' : 'left-1'
                            }`}></div>
                          </button>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <span className="text-xl">📱</span> Telegram
                            </h4>
                            <p className="text-xs text-gray-600">Mensagem direta</p>
                          </div>
                        </div>

                        {/* Toggle Email */}
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                          <button
                            type="button"
                            onClick={() => setNotifNoticiasEmail(!notifNoticiasEmail)}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              notifNoticiasEmail ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              notifNoticiasEmail ? 'right-1' : 'left-1'
                            }`}></div>
                          </button>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <span className="text-xl">📧</span> Email
                            </h4>
                            <p className="text-xs text-gray-600">Envio por email</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título da Notícia/Aviso
                      </label>
                      <input
                        type="text"
                        value={notifTituloNoticias}
                        onChange={(e) => setNotifTituloNoticias(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nova funcionalidade disponível!"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texto da Notícia/Aviso
                      </label>
                      <textarea
                        value={notifTextoNoticias}
                        onChange={(e) => setNotifTextoNoticias(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Agora você pode gerenciar seus grupos de forma mais eficiente com a nova interface..."
                        rows={4}
                      />
                    </div>

                    {/* Botão Enviar para Todos */}
                    <div className="border-t border-gray-200 pt-4">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!notifTituloNoticias || !notifTextoNoticias) {
                            alert('❌ Preencha o título e o texto da notícia antes de enviar');
                            return;
                          }

                          if (!notifNoticiasTelegram && !notifNoticiasEmail) {
                            alert('❌ Selecione pelo menos um canal de envio (Telegram ou Email)');
                            return;
                          }

                          const canais = [];
                          if (notifNoticiasTelegram) canais.push('Telegram 📱');
                          if (notifNoticiasEmail) canais.push('Email 📧');

                          const confirmacao = confirm(
                            `Confirma o envio desta mensagem para TODOS os membros via ${canais.join(' e ')}?\n\nTítulo: ${notifTituloNoticias}`
                          );

                          if (!confirmacao) return;

                          try {
                            setSaving(true);
                            const response = await fetch('/api/broadcast', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                titulo: notifTituloNoticias,
                                mensagem: notifTextoNoticias,
                                enviarTelegram: notifNoticiasTelegram,
                                enviarEmail: notifNoticiasEmail,
                              }),
                            });

                            const data = await response.json();

                            if (response.ok) {
                              alert(`✅ ${data.message}\n\nEnviado para: ${data.enviados} membros\nFalhas: ${data.falhas}`);
                            } else {
                              alert(`❌ Erro: ${data.error}`);
                            }
                          } catch (error: any) {
                            console.error('Erro ao enviar broadcast:', error);
                            alert('❌ Erro ao enviar mensagens: ' + error.message);
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving || (!notifNoticiasTelegram && !notifNoticiasEmail)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-3 shadow-lg"
                      >
                        <span className="text-2xl">📢</span>
                        <span>
                          {saving ? 'Enviando...' : 'Enviar para Todos os Membros'}
                        </span>
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        {notifNoticiasTelegram && notifNoticiasEmail
                          ? 'Mensagem será enviada via Telegram e Email'
                          : notifNoticiasTelegram
                          ? 'Mensagem será enviada apenas via Telegram'
                          : notifNoticiasEmail
                          ? 'Mensagem será enviada apenas via Email'
                          : 'Selecione pelo menos um canal de envio'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={saveConfigs}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            onClick={loadConfigs}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Recarregar
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Nota:</strong> As alterações são salvas no banco de dados e aplicadas imediatamente.
          </p>
        </div>
      </main>
    </div>
  );
}
