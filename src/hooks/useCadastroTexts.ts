import { useState, useEffect } from 'react';

interface CadastroTexts {
  cadastro_titulo: string;
  cadastro_subtitulo: string;
  cadastro_info_titulo: string;
  cadastro_info_texto: string;
  cadastro_aviso_titulo: string;
  cadastro_aviso_texto: string;
}

const defaultTexts: CadastroTexts = {
  cadastro_titulo: '📝 Cadastro de Membro',
  cadastro_subtitulo: 'Preencha seus dados para se cadastrar',
  cadastro_info_titulo: 'ℹ️ Como Funciona o Sistema',
  cadastro_info_texto: `Acesso Multi-Grupo: Ao se cadastrar, você terá acesso a TODOS os grupos do Telegram onde nosso bot está ativo.

• O mesmo cadastro funciona em todos os grupos
• A data de vencimento é compartilhada entre os grupos
• Use o comando /status no Telegram para verificar seu tempo restante

💡 Dica: Após o cadastro, você receberá um link para entrar nos grupos. Guarde esse link!`,
  cadastro_aviso_titulo: '⚠️ Importante - Gerenciamento de Acesso',
  cadastro_aviso_texto: `• Seu acesso possui uma data de vencimento
• Quando vencer, você será removido de TODOS os grupos simultaneamente
• Para renovar, entre em contato com os administradores antes do vencimento

💡 Use /status no Telegram para verificar sua data de vencimento!`,
};

export function useCadastroTexts() {
  const [texts, setTexts] = useState<CadastroTexts>(defaultTexts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTexts() {
      try {
        const response = await fetch('/api/cadastro-texts');
        const data = await response.json();

        if (data.success && data.data) {
          setTexts({
            cadastro_titulo: data.data.cadastro_titulo || defaultTexts.cadastro_titulo,
            cadastro_subtitulo: data.data.cadastro_subtitulo || defaultTexts.cadastro_subtitulo,
            cadastro_info_titulo: data.data.cadastro_info_titulo || defaultTexts.cadastro_info_titulo,
            cadastro_info_texto: data.data.cadastro_info_texto || defaultTexts.cadastro_info_texto,
            cadastro_aviso_titulo: data.data.cadastro_aviso_titulo || defaultTexts.cadastro_aviso_titulo,
            cadastro_aviso_texto: data.data.cadastro_aviso_texto || defaultTexts.cadastro_aviso_texto,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar textos:', error);
        // Manter textos padrão em caso de erro
      } finally {
        setLoading(false);
      }
    }

    loadTexts();
  }, []);

  return { texts, loading };
}
