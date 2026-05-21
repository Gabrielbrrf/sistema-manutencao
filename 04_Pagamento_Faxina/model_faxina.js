/* model_faxina.js - Lógica de Captura Inteligente (Híbrida) */

const OficinaModel = {
    listaColaboradores: [],

    async buscarColaboradores() {
        const { data, error } = await _supabase
            .from('contatos')
            .select('*')
            .order('nome', { ascending: true });
        
        if (error) {
            console.error("Erro ao buscar equipe:", error);
            return [];
        }
        this.listaColaboradores = data || [];
        return this.listaColaboradores;
    },

    interpretarTexto(texto) {
        if (!texto.trim()) {
            return this.retornarVazio();
        }

        // 1. VERIFICAÇÃO: É um Relatório Mensal Consolidado de Várias OSs?
        const ehRelatorioMensal = texto.includes("Comissões do funcionário") || texto.includes("Total Geral");

        if (ehRelatorioMensal) {
            // Captura o nome do funcionário (Ex: "16- MARCO AURÉLIO BERNARDO")
            const nomeMatch = texto.match(/\d+-\s*([A-ZÀ-Ú\s]+)/i);
            const nomePdf = nomeMatch ? nomeMatch[1].trim() : null;

            // Captura a linha de fechamento (Ex: "Total Geral 4.410,00 882,00")
            const linhaTotalMatch = texto.match(/(?:Total\s+Geral|SubTotal)[\D]*([0-9.,]+)[\D]+([0-9.,]+)/i);
            
            let totalServico = 0;
            let comissao = 0;

            if (linhaTotalMatch) {
                totalServico = this.converteValor(linhaTotalMatch[1]);
                comissao = this.converteValor(linhaTotalMatch[2]);
            }

            // Tenta pegar o período de referência do fechamento
            const refMatch = texto.match(/Referência\s+([0-9/]+\s+a\s+[0-9/]+)/i);
            const periodoDesc = refMatch ? `Fechamento Mensal (${refMatch[1].trim()})` : "Fechamento Mensal de Comissões";

            return {
                os: "Relatório Geral",
                servico: periodoDesc,
                pronto: "Consolidado",
                saida: "Mensal",
                totalServico: totalServico,
                taxa: 0, 
                subtotal: totalServico,
                comissao: comissao > 0 ? comissao : (totalServico * 0.20),
                nomeColaboradorPdf: nomePdf
            };
        }

        // 2. CASO PADRÃO: Layout de Ordem de Serviço Individual
        const osMatch = texto.match(/(?:OS|O\.S|Número|Nº|N[oO]|Num)[\s\n:]*([0-9]+)/i);
        const totalServicoMatch = texto.match(/(?:Total do Serviço|Total Serviço|Valor Serviço|Serviço)[\s\n:]*R?\$?\s*([0-9.,]+)/i);
        const taxaMatch = texto.match(/(?:20%|Taxa|Desc\.?\s*20%)[\s\n:]*R?\$?\s*([0-9.,]+)/i);
        const subtotalMatch = texto.match(/(?:Subtotal|Sub\s*total|Total Geral|Líquido|Valor Líquido)[\s\n:]*R?\$?\s*([0-9.,]+)/i);
        const comissaoMatch = texto.match(/(?:Comissão|Comissao|A receber|Pagar|Valor Comissão)[\s\n:]*R?\$?\s*([0-9.,]+)/i);
        
        const prontoMatch = texto.match(/Pronto[\s\n:]*([^\n|]+)/i);
        const saidaMatch = texto.match(/(?:Saída|Saida)[\s\n:]*([^\n|]+)/i);
        const servicoMatch = texto.match(/(?:Serviço|Desc|Descrição|Item|Obs)[\s\n:]*([^\n]+)/i);

        return {
            os: osMatch ? osMatch[1] : "Não identificada",
            servico: servicoMatch ? servicoMatch[1].trim() : "Geral / Oficina",
            pronto: prontoMatch ? prontoMatch[1].trim() : "Ok",
            saida: saidaMatch ? saidaMatch[1].trim() : "Imediata",
            totalServico: totalServicoMatch ? this.converteValor(totalServicoMatch[1]) : 0,
            taxa: taxaMatch ? this.converteValor(taxaMatch[1]) : 0,
            subtotal: subtotalMatch ? this.converteValor(subtotalMatch[1]) : 0,
            comissao: comissaoMatch ? this.converteValor(comissaoMatch[1]) : 0,
            nomeColaboradorPdf: null
        };
    },

    converteValor(stringValor) {
        if (!stringValor) return 0;
        let limpo = stringValor.replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(limpo) || 0;
    },

    retornarVazio() {
        return { os: "-", servico: "-", pronto: "-", saida: "-", totalServico: 0, taxa: 0, subtotal: 0, comissao: 0, nomeColaboradorPdf: null };
    }
};