/* controller_faxina.js - Versão Definitiva Sincronizada e Corrigida */

document.addEventListener("DOMContentLoaded", async () => {
    const filtroCategoria = document.getElementById('filtroCategoria');
    const selectColaborador = document.getElementById('selectColaborador');
    const dadosComissao = document.getElementById('dadosComissao');
    const btnWhatsAppTexto = document.getElementById('btnWhatsAppTexto');
    const btnImprimirPDF = document.getElementById('btnImprimirPDF');
    
    const btnUploadPdf = document.getElementById('btnUploadPdf');
    const inputPdf = document.getElementById('inputPdf');
    const nomeArquivoPdf = document.getElementById('nomeArquivoPdf');

    // Variáveis locais para controle da equipe
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

    // 1. CARREGAR EQUIPE DIRETO DA TABELA 'CONTATOS'
    async function carregarEquipeDoBanco() {
        try {
            const { data, error } = await _supabase
                .from('contatos')
                .select('nome, chave_pix, banco, telefone, categoria');

            if (error) throw error;

            if (data) {
                listaColaboradoresLocal = data;
                renderizarSelectColaboradores(filtroCategoria.value);
                console.log("✅ Equipe carregada com sucesso da tabela 'contatos'!");
            }
        } catch (err) {
            console.error("Erro ao buscar dados na tabela contatos:", err);
            selectColaborador.innerHTML = "<option value=''>❌ Erro ao conectar ao banco</option>";
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
            option.dataset.pix = c.chave_pix || '';
            option.dataset.banco = c.banco || '';
            option.dataset.tel = c.telefone || '';
            selectColaborador.appendChild(option);
        });
    }

    // 2. ATUALIZAÇÃO COMPATÍVEL COM AMBOS OS LAYOUTS DE TELA
    function atualizarTelaDinamica() {
        const opcaoAtiva = selectColaborador.options[selectColaborador.selectedIndex];
        const nome = selectColaborador.value ? selectColaborador.value : "-";
        const pix = (opcaoAtiva && opcaoAtiva.dataset.pix) ? opcaoAtiva.dataset.pix : "Não cadastrado";

        // Formatações de moeda amigáveis
        const strTotal = `R$ ${(Number(dadosAtuais.totalServico) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const strTaxa = `R$ ${(Number(dadosAtuais.taxa) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const strComissao = `R$ ${(Number(dadosAtuais.comissao) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        // Mapeamento dinâmico que atende tanto o primeiro layout quanto o demonstrativo detalhado
        const mapeamentoCampos = {
            'resColaborador': nome,
            'resOS': dadosAtuais.os || "Relatório Mensal",
            'resServico': dadosAtuais.servico || "Geral / Oficina",
            'resTotalServico': strTotal,
            'resTaxa': `- ${strTaxa}`,
            'valorTotalComissao': strComissao,
            'infoPixRecibo': `Destino: PIX ${pix}`,
            
            // Compatibilidade com IDs alternativos do layout de Demonstrativo de Repasse
            'colaboradorBeneficiario': nome,
            'documentoOS': dadosAtuais.os || "Relatório Mensal",
            'descricaoServico': dadosAtuais.servico || "Geral / Oficina",
            'volumeBruto': strTotal,
            'retencaoOperacional': `- ${strTaxa}`,
            'valorLiquidoComissao': strComissao
        };

        // Varre e atualiza apenas os elementos existentes no DOM da página atual
        Object.entries(mapeamentoCampos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                if (elemento.tagName === "INPUT" || elemento.tagName === "TEXTAREA") {
                    elemento.value = valor;
                } else {
                    elemento.textContent = valor;
                }
            }
        });
    }

    // 3. LEITURA REFORMULADA E PARSER INTELIGENTE DO TEXTO DO PDF
    function interpretarTextoOficina(texto) {
        const resultado = {
            os: "Relatório Mensal",
            servico: "Geral / Oficina",
            totalServico: 0,
            taxa: 0,
            subtotal: 0,
            comissao: 0,
            nomeColaboradorPdf: ""
        };

        if (!texto) return resultado;

        // 1. Localiza o nome do funcionário eliminando prefixos numéricos
        const regexNome = /(?:Comissões do funcionário|funcionário).*?\n(?:.*?-\s*)?([A-ZÁÉÍÓÚÂÊÔ⚠️ ]+)/i;
        const linhas = texto.split('\n');
        for (let linha of linhas) {
            if (linha.toUpperCase().includes('MARCO') || linha.toUpperCase().includes('BERNARDO') || linha.toUpperCase().includes('BERNADO')) {
                resultado.nomeColaboradorPdf = linha.replace(/^\d+-\s*/, '').replace(/["',]/g, '').trim();
                break;
            }
        }

        // 2. Captura de valores baseada no padrão estruturado do fechamento do relatório (SubTotal / Total Geral)
        // Esse regex captura os valores ignorando as aspas, espaços e vírgulas da tabela gerada pelo leitor
        const regexSubTotal = /SubTotal\s*["']?\s*,\s*["']?\s*([\d.]+,\d{2})\s*["']?\s*,\s*["']?\s*([\d.]+,\d{2})/i;
        const matchSub = texto.match(regexSubTotal);

        if (matchSub) {
            const bruto = parseFloat(matchSub[1].replace(/\./g, '').replace(',', '.'));
            const comis = parseFloat(matchSub[2].replace(/\./g, '').replace(',', '.'));
            
            resultado.totalServico = bruto;
            resultado.taxa = bruto - comis; // Calcula a retenção real exata da diferença
            resultado.subtotal = bruto;
            resultado.comissao = comis;
        } else {
            // Fallback robusto para buscar as duas últimas linhas financeiras caso o layout mude
            const valoresDinheiro = texto.match(/[\d.]+,\d{2}/g);
            if (valoresDinheiro && valoresDinheiro.length >= 2) {
                const comis = parseFloat(valoresDinheiro[valoresDinheiro.length - 1].replace(/\./g, '').replace(',', '.'));
                const bruto = parseFloat(valoresDinheiro[valoresDinheiro.length - 2].replace(/\./g, '').replace(',', '.'));
                
                resultado.totalServico = bruto;
                resultado.taxa = bruto - comis;
                resultado.comissao = comis;
            }
        }
        return resultado;
    }

    // 4. MECANISMO DE DRAG / UPLOAD E EXTRAÇÃO ROBUSTA DO ARQUIVO PDF
    if (btnUploadPdf && inputPdf) {
        btnUploadPdf.onclick = () => inputPdf.click();

        inputPdf.onchange = async (e) => {
            const arquivo = e.target.files[0];
            if (!arquivo) return;

            nomeArquivoPdf.textContent = arquivo.name;
            btnUploadPdf.innerText = "🔄 Processando...";
            btnUploadPdf.style.background = "#d97706";

            const fileReader = new FileReader();
            fileReader.onload = async function (event) {
                try {
                    const arrayBuffer = new Uint8Array(event.target.result);
                    
                    // Configuração explícita do PDF.js
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;
                    
                    let textoCompleto = "";

                    // Varre as páginas garantindo o fluxo assíncrono correto de cada item
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const pagina = await pdf.getPage(i);
                        
                        // O segredo está aqui: disableCombineTextItems false permite capturar o fluxo de colunas
                        const conteudo = await pagina.getTextContent({ disableCombineTextItems: false });
                        
                        // Une os fragmentos mantendo um espaço simples entre colunas da tabela
                        const textoPagina = conteudo.items.map(item => item.str).join(" ");
                        textoCompleto += textoPagina + "\n";
                    }

                    // Limpa quebras sobressalentes e força a exibição real de TODO o texto no textarea
                    const textoLimpo = textoCompleto.trim();
                    dadosComissao.value = textoLimpo;
                    
                    // Executa o interpretador inteligente sobre a massa de dados real
                    dadosAtuais = interpretarTextoOficina(textoLimpo);

                    // Vincula o Colaborador Automaticamente
                    if (dadosAtuais.nomeColaboradorPdf) {
                        const simplificar = (str) => str.toLowerCase().replace(/[^a-z]/g, '').replace('bernardo', 'bernado');
                        const nomeInjetado = simplificar(dadosAtuais.nomeColaboradorPdf);
                        
                        for (let option of selectColaborador.options) {
                            if (!option.value) continue;
                            const nomeOpcao = simplificar(option.value);
                            
                            if (nomeInjetado.includes(nomeOpcao) || nomeOpcao.includes(nomeInjetado) || nomeInjetado.substring(0, 6) === nomeOpcao.substring(0, 6)) {
                                selectColaborador.value = option.value;
                                break;
                            }
                        }
                    }

                    atualizarTelaDinamica();
                    btnUploadPdf.innerText = "✅ PDF Processado!";
                    btnUploadPdf.style.background = "#059669";

                } catch (err) {
                    console.error("Erro interno no PDF:", err);
                    alert("Falha na extração dos dados estruturados: " + err.message);
                    resetarBotao();
                }
            };
            fileReader.readAsArrayBuffer(arquivo);
        };
    }

    // 5. EVENTOS DE INTERAÇÃO
    filtroCategoria.onchange = () => {
        renderizarSelectColaboradores(filtroCategoria.value);
        atualizarTelaDinamica();
    };

    selectColaborador.onchange = () => {
        atualizarTelaDinamica();
    };

    dadosComissao.oninput = () => {
        dadosAtuais = interpretarTextoOficina(dadosComissao.value);
        atualizarTelaDinamica();
    };

    // 6. ENVIO PARA O WHATSAPP E SALVAMENTO DO HISTÓRICO
    btnWhatsAppTexto.onclick = async () => {
        if (!selectColaborador.value) {
            alert("⚠️ Selecione um colaborador ativo antes de enviar!");
            return;
        }

        btnWhatsAppTexto.disabled = true;
        btnWhatsAppTexto.innerText = "🔄 Salvando no Supabase...";

        const opcaoAtiva = selectColaborador.options[selectColaborador.selectedIndex];
        const nomeColaborador = opcaoAtiva.value;
        const pixColaborador = opcaoAtiva.dataset.pix || 'Não informado';
        const bancoColaborador = opcaoAtiva.dataset.banco || 'Não informado';
        let telefone = opcaoAtiva.dataset.tel ? opcaoAtiva.dataset.tel.replace(/\D/g, '') : '';

        try {
            const { error } = await _supabase.from('comissoes_oficina').insert([{
                colaborador: nomeColaborador,
                numero_os: dadosAtuais.os,
                servico: dadosAtuais.servico,
                total_servico: Number(dadosAtuais.totalServico) || 0,
                taxa_administrativa: Number(dadosAtuais.taxa) || 0,
                subtotal: Number(dadosAtuais.subtotal) || 0,
                valor_comissao: Number(dadosAtuais.comissao) || 0,
                data_registro: new Date().toISOString()
            }]);
            
            if (error) throw error;
            console.log("✅ Dados gravados com sucesso!");
        } catch (err) {
            console.error("Erro ao salvar histórico:", err);
        }

        let msg = `*⚙️ RELATÓRIO DE COMISSÃO - OFICINA*\n\n`;
        msg += `👤 *Colaborador:* ${nomeColaborador}\n`;
        msg += `📌 *Documento:* ${dadosAtuais.os}\n`;
        msg += `🛠️ *Serviço:* ${dadosAtuais.servico}\n`;
        msg += `💵 *Volume Bruto Realizado:* R$ ${(dadosAtuais.totalServico || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        msg += `📊 *Retenção Operacional (20%):* R$ ${(dadosAtuais.taxa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
        msg += `💰 *VALOR LÍQUIDO DA COMISSÃO:* *R$ ${(dadosAtuais.comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
        msg += `*Pagamento:*\n🔑 *PIX:* ${pixColaborador}\n🏦 *Banco:* ${bancoColaborador}`;

        if (telefone && telefone.length <= 11) telefone = '55' + telefone;
        window.open(`https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(msg)}`, '_blank');

        btnWhatsAppTexto.disabled = false;
        btnWhatsAppTexto.innerText = "💬 Enviar via Whats";
    };

    btnImprimirPDF.onclick = () => window.print();

    // Executa a carga inicial da equipe ao abrir a página
    await carregarEquipeDoBanco();
});