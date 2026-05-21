/* controller_faxina.js - VERSÃO DEFINITIVA E OTIMIZADA */

document.addEventListener("DOMContentLoaded", async () => {
    const filtroCategoria = document.getElementById('filtroCategoria');
    const selectColaborador = document.getElementById('selectColaborador');
    const dadosComissao = document.getElementById('dadosComissao');
    const btnWhatsAppTexto = document.getElementById('btnWhatsAppTexto');
    const btnImprimirPDF = document.getElementById('btnImprimirPDF');
    const btnUploadPdf = document.getElementById('btnUploadPdf');
    const inputPdf = document.getElementById('inputPdf');
    const nomeArquivoPdf = document.getElementById('nomeArquivoPdf');

    let listaColaboradoresLocal = [];
    let dadosAtuais = { os: "Relatório Mensal", servico: "Geral / Oficina", totalServico: 0, taxa: 0, comissao: 0, nomeColaboradorPdf: "" };

    function resetarBotao() {
        btnUploadPdf.innerText = "📁 Escolher PDF da OS";
        btnUploadPdf.style.background = "#4f46e5";
    }

    async function carregarEquipeDoBanco() {
        try {
            const { data, error } = await _supabase.from('contatos').select('nome, chave_pix, banco, telefone, categoria');
            if (error) throw error;
            listaColaboradoresLocal = data || [];
            renderizarSelectColaboradores(filtroCategoria.value);
        } catch (err) { console.error("Erro ao carregar equipe:", err); }
    }

    function renderizarSelectColaboradores(categoriaFiltro) {
        selectColaborador.innerHTML = '<option value="">Selecione o Colaborador...</option>';
        listaColaboradoresLocal.filter(c => categoriaFiltro === "TODOS" || c.categoria === categoriaFiltro).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nome; opt.textContent = c.nome;
            opt.dataset.pix = c.chave_pix || ''; opt.dataset.banco = c.banco || ''; opt.dataset.tel = c.telefone || '';
            selectColaborador.appendChild(opt);
        });
    }

    function atualizarTelaDinamica() {
        const op = selectColaborador.options[selectColaborador.selectedIndex];
        const nome = selectColaborador.value || "-";
        const pix = (op && op.dataset.pix) ? op.dataset.pix : "Não cadastrado";
        
        const m = {
            'resColaborador': nome, 'resOS': dadosAtuais.os, 'resServico': dadosAtuais.servico,
            'resTotalServico': `R$ ${(Number(dadosAtuais.totalServico) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'resTaxa': `- R$ ${(Number(dadosAtuais.taxa) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'valorTotalComissao': `R$ ${(Number(dadosAtuais.comissao) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'infoPixRecibo': `Destino: PIX ${pix}`,
            'colaboradorBeneficiario': nome, 'documentoOS': dadosAtuais.os, 'descricaoServico': dadosAtuais.servico,
            'volumeBruto': `R$ ${(Number(dadosAtuais.totalServico) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'retencaoOperacional': `- R$ ${(Number(dadosAtuais.taxa) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'valorLiquidoComissao': `R$ ${(Number(dadosAtuais.comissao) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        };
        Object.entries(m).forEach(([id, val]) => { const el = document.getElementById(id); if (el) { el.tagName === "INPUT" ? el.value = val : el.textContent = val; } });
    }

    function interpretarTextoOficina(texto) {
        const res = { os: "Relatório Mensal", servico: "Geral / Oficina", totalServico: 0, taxa: 0, comissao: 0, nomeColaboradorPdf: "" };
        const matchNome = texto.match(/(?:funcionário).*?\n(?:.*?-\s*)?([A-ZÁÉÍÓÚÂÊÔ ]+)/i);
        if (matchNome) res.nomeColaboradorPdf = matchNome[1].trim();
        const v = texto.match(/[\d.]+,\d{2}/g);
        if (v && v.length >= 2) {
            const bruto = parseFloat(v[v.length - 2].replace(/\./g, '').replace(',', '.'));
            const comis = parseFloat(v[v.length - 1].replace(/\./g, '').replace(',', '.'));
            res.totalServico = bruto; res.comissao = comis; res.taxa = bruto - comis;
        }
        return res;
    }

    if (btnUploadPdf) {
        btnUploadPdf.onclick = () => inputPdf.click();
        inputPdf.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            btnUploadPdf.innerText = "🔄 Processando última página...";
            try {
                const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
                // LÊ APENAS A ÚLTIMA PÁGINA PARA NÃO TRAVAR O NAVEGADOR
                const pg = await pdf.getPage(pdf.numPages);
                const content = await pg.getTextContent();
                const texto = content.items.map(i => i.str).join(" ");
                
                dadosComissao.value = texto;
                dadosAtuais = interpretarTextoOficina(texto);
                
                for (let op of selectColaborador.options) {
                    if (dadosAtuais.nomeColaboradorPdf.toUpperCase().includes(op.value.toUpperCase())) {
                        selectColaborador.value = op.value; break;
                    }
                }
                atualizarTelaDinamica();
                btnUploadPdf.innerText = "✅ Processado!";
            } catch (err) { alert("Erro: " + err.message); resetarBotao(); }
        };
    }

    btnWhatsAppTexto.onclick = async () => {
        const op = selectColaborador.options[selectColaborador.selectedIndex];
        if (!op.value) return alert("Selecione o colaborador!");
        
        btnWhatsAppTexto.innerText = "🔄 Salvando...";
        try {
            await _supabase.from('comissoes_oficina').insert([{
                colaborador: op.value, numero_os: dadosAtuais.os, servico: dadosAtuais.servico,
                total_servico: dadosAtuais.totalServico, taxa_administrativa: dadosAtuais.taxa,
                valor_comissao: dadosAtuais.comissao, data_registro: new Date().toISOString()
            }]);
            
            let tel = op.dataset.tel ? '55' + op.dataset.tel.replace(/\D/g, '') : '';
            let msg = `*RELATÓRIO DE COMISSÃO*\n\nColaborador: ${op.value}\nBruto: R$ ${dadosAtuais.totalServico.toFixed(2)}\nComissão: R$ ${dadosAtuais.comissao.toFixed(2)}\nPIX: ${op.dataset.pix}`;
            window.open(`https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(msg)}`, '_blank');
        } catch (err) { alert("Erro ao salvar: " + err.message); }
        btnWhatsAppTexto.innerText = "💬 Enviar via Whats";
    };

    btnImprimirPDF.onclick = () => window.print();
    filtroCategoria.onchange = () => { renderizarSelectColaboradores(filtroCategoria.value); atualizarTelaDinamica(); };
    selectColaborador.onchange = atualizarTelaDinamica;
    await carregarEquipeDoBanco();
});