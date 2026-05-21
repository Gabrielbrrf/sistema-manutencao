/* controller_faxina.js - Versão Corrigida para Layout de Comissões */

document.addEventListener("DOMContentLoaded", async () => {
    const filtroCategoria   = document.getElementById('filtroCategoria');
    const selectColaborador = document.getElementById('selectColaborador');
    const dadosComissao     = document.getElementById('dadosComissao');
    const btnWhatsAppTexto  = document.getElementById('btnWhatsAppTexto');
    const btnImprimirPDF    = document.getElementById('btnImprimirPDF');
    const btnUploadPdf      = document.getElementById('btnUploadPdf');
    const inputPdf          = document.getElementById('inputPdf');
    const nomeArquivoPdf    = document.getElementById('nomeArquivoPdf');

    let listaColaboradoresLocal = [];
    let dadosAtuais = {
        os: "Relatório Geral",
        servico: "Geral / Oficina",
        totalServico: 0,
        taxa: 0,
        subtotal: 0,
        comissao: 0,
        nomeColaboradorPdf: ""
    };

    // ─── 1. CARREGAR EQUIPE ───────────────────────────────────────────────────
    async function carregarEquipeDoBanco() {
        try {
            const { data, error } = await _supabase
                .from('contatos')
                .select('nome, chave_pix, banco, telefone, categoria');

            if (error) throw error;

            listaColaboradoresLocal = data || [];
            renderizarSelectColaboradores(filtroCategoria.value);
            console.log("✅ Equipe carregada:", listaColaboradoresLocal.length, "colaboradores");
        } catch (err) {
            console.error("Erro ao buscar contatos:", err);
            selectColaborador.innerHTML = "<option value=''>❌ Erro ao conectar</option>";
        }
    }

    function renderizarSelectColaboradores(categoriaFiltro) {
        selectColaborador.innerHTML = '<option value="">Selecione o Colaborador...</option>';

        const filtrados = listaColaboradoresLocal.filter(c => {
            if (categoriaFiltro === "TODOS") return true;
            return c.categoria === categoriaFiltro;
        });

        filtrados.forEach(c => {
            const option = document.createElement('option');
            option.value = c.nome;
            option.textContent = c.nome;
            option.dataset.pix   = c.chave_pix  || '';
            option.dataset.banco = c.banco       || '';
            option.dataset.tel   = c.telefone    || '';
            selectColaborador.appendChild(option);
        });
    }

    // ─── 2. ATUALIZAR TELA ───────────────────────────────────────────────────
    function atualizarTela() {
        const opcao = selectColaborador.options[selectColaborador.selectedIndex];
        const nome  = selectColaborador.value || "-";
        const pix   = (opcao && opcao.dataset.pix) ? opcao.dataset.pix : "Não cadastrado";

        const fmt = v => `R$ ${(Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        const campos = {
            'resColaborador'     : nome,
            'nomeAssinatura'     : `Assinatura: ${nome}`,
            'resOS'              : dadosAtuais.os      || "Relatório Mensal",
            'resServico'         : dadosAtuais.servico || "Geral / Oficina",
            'resPronto'          : dadosAtuais.pronto  || "-",
            'resSaida'           : dadosAtuais.saida   || "-",
            'resTotalServico'    : fmt(dadosAtuais.totalServico),
            'resTaxa'            : `- ${fmt(dadosAtuais.taxa)}`,
            'valorTotalComissao' : fmt(dadosAtuais.comissao),
            'infoPixRecibo'      : `Destino: PIX ${pix}`,
        };

        Object.entries(campos).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.tagName === "INPUT" || el.tagName === "TEXTAREA"
                ? el.value = val
                : el.textContent = val;
        });

        // Esconde linha de taxa se for relatório consolidado
        const linhaTaxa = document.getElementById('linhaTaxaAdm');
        if (linhaTaxa) {
            linhaTaxa.style.display = dadosAtuais.os === "Relatório Geral" ? 'none' : 'flex';
        }
    }

    // ─── 3. EXTRAIR TEXTO DO PDF POR POSIÇÃO (linha a linha) ─────────────────
    async function extrairTextoPDF(arrayBuffer) {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

        let linhasGlobais = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const pagina  = await pdf.getPage(i);

            // disableCombineTextItems: true → pega cada fragmento separado com coordenada Y real
            const conteudo = await pagina.getTextContent({ disableCombineTextItems: true });

            // Agrupa fragmentos pela posição Y (arredondada em 3px para tolerar variação)
            const mapaLinhas = {};
            conteudo.items.forEach(item => {
                if (!item.str.trim()) return;
                const y = Math.round(item.transform[5] / 3) * 3; // agrupa por faixa de 3pt
                if (!mapaLinhas[y]) mapaLinhas[y] = [];
                mapaLinhas[y].push({ x: item.transform[4], texto: item.str });
            });

            // Ordena por Y decrescente (PDF tem Y invertido: maior Y = topo)
            const ysOrdenados = Object.keys(mapaLinhas).map(Number).sort((a, b) => b - a);

            ysOrdenados.forEach(y => {
                // Ordena fragmentos da linha por X crescente (esquerda → direita)
                const linha = mapaLinhas[y]
                    .sort((a, b) => a.x - b.x)
                    .map(f => f.texto)
                    .join(' ');
                linhasGlobais.push(linha.trim());
            });
        }

        return linhasGlobais.join('\n');
    }

    // ─── 4. PARSER DO TEXTO EXTRAÍDO ─────────────────────────────────────────
    function interpretarTexto(texto) {
        const resultado = {
            os: "Relatório Geral",
            servico: "Geral / Oficina",
            pronto: "Consolidado",
            saida: "Mensal",
            totalServico: 0,
            taxa: 0,
            subtotal: 0,
            comissao: 0,
            nomeColaboradorPdf: ""
        };

        if (!texto) return resultado;

        const linhas = texto.split('\n');

        // Nome: linha que contém padrão "N - NOME SOBRENOME" (ex: "16 - MARCO AURÉLIO BERNARDO")
        for (const linha of linhas) {
            const mNome = linha.match(/^\d+\s*-\s*([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÇ\s]+)$/i);
            if (mNome) {
                resultado.nomeColaboradorPdf = mNome[1].trim();
                break;
            }
        }

        // Período de referência
        const mRef = texto.match(/Referência\s+([\d/]+\s*a\s*[\d/]+)/i);
        if (mRef) {
            resultado.servico = `Fechamento ${mRef[1].trim()}`;
        }

        // Estratégia: pega TODOS os valores monetários do documento
        // O PDF tem colunas: OS | Serviço | Pronto | Saída | Total | Comis.(20%)
        // SubTotal e Total Geral aparecem com os dois últimos valores sendo total e comissão

        // Busca linha de SubTotal ou Total Geral
        // Após a extração por Y, a linha vai ser algo como:
        // "SubTotal 4.410,00 882,00"  ou  "Total Geral 4.410,00 882,00"
        const reSubTotal  = /(?:SubTotal|Total\s+Geral)\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})/i;
        const mSub = texto.match(reSubTotal);

        if (mSub) {
            resultado.totalServico = converteValor(mSub[1]);
            resultado.comissao     = converteValor(mSub[2]);
            resultado.taxa         = resultado.totalServico - resultado.comissao;
            resultado.subtotal     = resultado.totalServico;
            console.log("✅ Parser regex direto funcionou:", mSub[1], mSub[2]);
            return resultado;
        }

        // Fallback: se o PDF quebrou os valores em linhas separadas,
        // pega os dois últimos valores numéricos do documento
        // (que no layout sempre são Total e Comissão)
        const todosValores = [...texto.matchAll(/([\d]{1,3}(?:\.[\d]{3})*,\d{2})/g)]
            .map(m => converteValor(m[1]))
            .filter(v => v > 0);

        if (todosValores.length >= 2) {
            // Os dois maiores valores repetidos no final são Total Geral e Comissão
            resultado.totalServico = todosValores[todosValores.length - 2];
            resultado.comissao     = todosValores[todosValores.length - 1];
            resultado.taxa         = resultado.totalServico - resultado.comissao;
            resultado.subtotal     = resultado.totalServico;
            console.log("⚠️ Fallback valores finais:", resultado.totalServico, resultado.comissao);
        }

        return resultado;
    }

    function converteValor(str) {
        if (!str) return 0;
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }

    // ─── 5. VINCULAR COLABORADOR PELO NOME DO PDF ────────────────────────────
    function vincularColaborador(nomePdf) {
        if (!nomePdf) return;

        const normalizar = s => s.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
            .replace(/[^a-z\s]/g, '')
            .trim();

        const nomePdfNorm = normalizar(nomePdf);

        for (const option of selectColaborador.options) {
            if (!option.value) continue;
            const nomeOptNorm = normalizar(option.value);

            // Verifica se os primeiros 6 caracteres batem ou se um contém o outro
            const bate = nomePdfNorm.includes(nomeOptNorm) ||
                         nomeOptNorm.includes(nomePdfNorm) ||
                         nomePdfNorm.substring(0, 6) === nomeOptNorm.substring(0, 6);

            if (bate) {
                selectColaborador.value = option.value;
                console.log("✅ Colaborador vinculado automaticamente:", option.value);
                break;
            }
        }
    }

    // ─── 6. UPLOAD DO PDF ────────────────────────────────────────────────────
    if (btnUploadPdf && inputPdf) {
        btnUploadPdf.onclick = () => inputPdf.click();

        inputPdf.onchange = async (e) => {
            const arquivo = e.target.files[0];
            if (!arquivo) return;

            nomeArquivoPdf.textContent = arquivo.name;
            btnUploadPdf.innerText     = "🔄 Processando...";
            btnUploadPdf.style.background = "#d97706";

            try {
                const arrayBuffer = await arquivo.arrayBuffer();
                const textoExtraido = await extrairTextoPDF(arrayBuffer);

                console.log("📄 Texto extraído do PDF:\n", textoExtraido);

                dadosComissao.value = textoExtraido;
                dadosAtuais = interpretarTexto(textoExtraido);

                vincularColaborador(dadosAtuais.nomeColaboradorPdf);
                atualizarTela();

                btnUploadPdf.innerText = "✅ PDF Processado!";
                btnUploadPdf.style.background = "#059669";
            } catch (err) {
                console.error("❌ Erro ao processar PDF:", err);
                alert("Erro ao ler o PDF: " + err.message);
                btnUploadPdf.innerText = "📁 Escolher PDF da OS";
                btnUploadPdf.style.background = "#4f46e5";
            }
        };
    }

    // ─── 7. EVENTOS ──────────────────────────────────────────────────────────
    filtroCategoria.onchange = () => {
        renderizarSelectColaboradores(filtroCategoria.value);
        atualizarTela();
    };

    selectColaborador.onchange = () => atualizarTela();

    dadosComissao.oninput = () => {
        dadosAtuais = interpretarTexto(dadosComissao.value);
        atualizarTela();
    };

    // ─── 8. ENVIO WHATSAPP + SALVAR NO SUPABASE ───────────────────────────────
    btnWhatsAppTexto.onclick = async () => {
        if (!selectColaborador.value) {
            alert("⚠️ Selecione um colaborador antes de enviar!");
            return;
        }

        btnWhatsAppTexto.disabled = true;
        btnWhatsAppTexto.innerText = "🔄 Salvando...";

        const opcao  = selectColaborador.options[selectColaborador.selectedIndex];
        const nome   = opcao.value;
        const pix    = opcao.dataset.pix   || 'Não informado';
        const banco  = opcao.dataset.banco || 'Não informado';
        let   tel    = opcao.dataset.tel   ? opcao.dataset.tel.replace(/\D/g, '') : '';

        try {
            const { error } = await _supabase.from('comissoes_oficina').insert([{
                colaborador       : nome,
                numero_os         : dadosAtuais.os,
                servico           : dadosAtuais.servico,
                total_servico     : Number(dadosAtuais.totalServico) || 0,
                taxa_administrativa: Number(dadosAtuais.taxa)        || 0,
                subtotal          : Number(dadosAtuais.subtotal)     || 0,
                valor_comissao    : Number(dadosAtuais.comissao)     || 0,
                data_registro     : new Date().toISOString()
            }]);
            if (error) throw error;
            console.log("✅ Salvo no Supabase!");
        } catch (err) {
            console.error("Erro ao salvar:", err);
        }

        const fmt = v => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        let msg = `*⚙️ RELATÓRIO DE COMISSÃO - OFICINA*\n\n`;
        msg += `👤 *Colaborador:* ${nome}\n`;
        msg += `📌 *Período:* ${dadosAtuais.servico}\n`;
        msg += `💵 *Volume Bruto:* R$ ${fmt(dadosAtuais.totalServico)}\n`;
        msg += `📊 *Retenção (20%):* R$ ${fmt(dadosAtuais.taxa)}\n\n`;
        msg += `💰 *COMISSÃO LÍQUIDA:* *R$ ${fmt(dadosAtuais.comissao)}*\n\n`;
        msg += `*Pagamento:*\n🔑 *PIX:* ${pix}\n🏦 *Banco:* ${banco}`;

        if (tel && tel.length <= 11) tel = '55' + tel;
        window.open(`https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(msg)}`, '_blank');

        btnWhatsAppTexto.disabled = false;
        btnWhatsAppTexto.innerText = "💬 Enviar via Whats";
    };

    btnImprimirPDF.onclick = () => window.print();

    // ─── INIT ─────────────────────────────────────────────────────────────────
    await carregarEquipeDoBanco();
});