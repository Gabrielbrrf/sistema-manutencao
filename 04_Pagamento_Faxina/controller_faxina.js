/* controller_faxina.js - Mecanismo de Upload Espacial e Controle do Recibo */

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

document.addEventListener("DOMContentLoaded", () => {
    const filtroCategoria = document.getElementById('filtroCategoria');
    const selectColaborador = document.getElementById('selectColaborador');
    const dadosComissao = document.getElementById('dadosComissao');
    const btnWhatsAppTexto = document.getElementById('btnWhatsAppTexto');
    const btnImprimirPDF = document.getElementById('btnImprimirPDF');
    
    const btnUploadPdf = document.getElementById('btnUploadPdf');
    const inputPdf = document.getElementById('inputPdf');
    const nomeArquivoPdf = document.getElementById('nomeArquivoPdf');

    // Estado global da leitura ativa para permitir re-renderizações fluidas
    let dadosAtuais = OficinaModel.retornarVazio();

    inicializarMódulo();

    async function inicializarMódulo() {
        try {
            const equipe = await OficinaModel.buscarColaboradores();
            OficinaView.atualizarSelectColaboradores(equipe, filtroCategoria.value);
            console.log("✅ Equipe sincronizada!");
        } catch (err) {
            console.error("Erro na inicialização:", err);
            selectColaborador.innerHTML = "<option>❌ Erro ao carregar equipe</option>";
        }
    }

    // Gerenciador centralizado de renderização unificada
    function atualizarTelaDinamica() {
        const opcaoAtiva = selectColaborador.options[selectColaborador.selectedIndex];
        const nome = selectColaborador.value ? selectColaborador.value : "-";
        const pix = (opcaoAtiva && opcaoAtiva.dataset.pix) ? opcaoAtiva.dataset.pix : "Não informado";
        
        // Passa os dados brutos + metadados do contato para a View deixar "tudo bonitim"
        OficinaView.renderizarCampos(dadosAtuais, nome, pix);
    }

    // ===================================================
    // RECONSTRUTOR DE MATRIZ TEXTUAL DO PDF (TOLERÂNCIA AMPLIADA PARA 10)
    // ===================================================
    if (btnUploadPdf && inputPdf) {
        btnUploadPdf.onclick = () => inputPdf.click();

        inputPdf.onchange = async (e) => {
            const arquivo = e.target.files[0];
            if (!arquivo) return;

            nomeArquivoPdf.textContent = arquivo.name;
            btnUploadPdf.innerText = "🔄 Mapeando Tabela...";
            btnUploadPdf.style.background = "#d97706";

            try {
                const fileReader = new FileReader();
                fileReader.onload = async function (event) {
                    try {
                        const arrayBuffer = new Uint8Array(event.target.result);
                        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                        let textoCompleto = "";

                        for (let i = 1; i <= pdf.numPages; i++) {
                            const pagina = await pdf.getPage(i);
                            const conteudo = await pagina.getTextContent();
                            
                            // Ordenação geométrica corrigida para tabelas densas (10px de limite)
                            const itensMapeados = [...conteudo.items].sort((a, b) => {
                                if (Math.abs(a.transform[5] - b.transform[5]) > 10) {
                                    return b.transform[5] - a.transform[5]; 
                                }
                                return a.transform[4] - b.transform[4]; 
                            });

                            let textoPagina = "";
                            let ultimoY = null;

                            for (const item of itensMapeados) {
                                if (!item.str) continue;

                                if (ultimoY !== null && Math.abs(item.transform[5] - ultimoY) > 10) {
                                    textoPagina += "\n";
                                } else if (textoPagina !== "" && !textoPagina.endsWith("\n") && !textoPagina.endsWith(" ")) {
                                    textoPagina += " ";
                                }
                                textoPagina += item.str;
                                ultimoY = item.transform[5];
                            }
                            textoCompleto += textoPagina + "\n";
                        }

                        // Carrega o texto bruto final no textarea
                        dadosComissao.value = textoCompleto.trim();

                        // Processa a inteligência do Regex no Model
                        dadosAtuais = OficinaModel.interpretarTexto(textoCompleto);

                        // MÁGICA DE AUTO-SELEÇÃO DO MECÂNICO
                        if (dadosAtuais.nomeColaboradorPdf) {
                            const nomeAlvo = dadosAtuais.nomeColaboradorPdf.toLowerCase().trim();
                            let achou = false;

                            for (let option of selectColaborador.options) {
                                if (option.value && (nomeAlvo.includes(option.value.toLowerCase().trim()) || option.value.toLowerCase().trim().includes(nomeAlvo))) {
                                    selectColaborador.value = option.value;
                                    achou = true;
                                    break;
                                }
                            }
                            
                            if (!achou) {
                                filtroCategoria.value = "TODOS";
                                OficinaView.atualizarSelectColaboradores(OficinaModel.listaColaboradores, "TODOS");
                                for (let option of selectColaborador.options) {
                                    if (option.value && (nomeAlvo.includes(option.value.toLowerCase().trim()) || option.value.toLowerCase().trim().includes(nomeAlvo))) {
                                        selectColaborador.value = option.value;
                                        break;
                                    }
                                }
                            }
                        }

                        // Atualiza os componentes gráficos do recibo
                        atualizarTelaDinamica();

                        btnUploadPdf.innerText = "✅ PDF Processado!";
                        btnUploadPdf.style.background = "#059669";

                    } catch (pdfError) {
                        console.error("Falha ao ler estrutura do PDF:", pdfError);
                        alert("Não foi possível processar este arquivo PDF.");
                        resetarBotao();
                    }
                };
                fileReader.readAsArrayBuffer(arquivo);

            } catch (err) {
                console.error("Erro no FileReader:", err);
                resetarBotao();
            }
        };
    }

    function resetarBotao() {
        btnUploadPdf.innerText = "📁 Escolher PDF da OS";
        btnUploadPdf.style.background = "#4f46e5";
    }

    // ===================================================
    // DETECÇÃO DE MUDANÇAS DE ESTADO (INPUTS E SELECTS)
    // ===================================================
    filtroCategoria.onchange = () => {
        OficinaView.atualizarSelectColaboradores(OficinaModel.listaColaboradores, filtroCategoria.value);
        atualizarTelaDinamica();
    };

    selectColaborador.onchange = () => {
        atualizarTelaDinamica();
    };

    dadosComissao.oninput = () => {
        dadosAtuais = OficinaModel.interpretarTexto(dadosComissao.value);
        atualizarTelaDinamica();
    };

    // ===================================================
    // ARMAZENAMENTO HISTÓRICO NO SUPABASE E WHATSAPP
    // ===================================================
    btnWhatsAppTexto.onclick = async () => {
        if (!selectColaborador.value) {
            alert("⚠️ Selecione ou importe um colaborador válido!");
            return;
        }

        btnWhatsAppTexto.disabled = true;
        btnWhatsAppTexto.innerText = "🔄 Salvando Histórico...";

        const opcaoAtiva = selectColaborador.options[selectColaborador.selectedIndex];
        const nomeColaborador = opcaoAtiva.value;
        const pixColaborador = opcaoAtiva.dataset.pix || 'Não informado';
        const bancoColaborador = opcaoAtiva.dataset.banco || 'Não informado';
        let telefone = opcaoAtiva.dataset.tel ? opcaoAtiva.dataset.tel.replace(/\D/g, '') : '';

        // Gravação Real na tabela criada no seu Supabase para alimentar relatórios futuros
        try {
            const { error } = await _supabase.from('comissoes_oficina').insert([{
                colaborador: nomeColaborador,
                numero_os: dadosAtuais.os || "Relatório Geral",
                servico: dadosAtuais.servico || "Geral / Oficina",
                total_servico: Number(dadosAtuais.totalServico) || 0,
                taxa_administrativa: Number(dadosAtuais.taxa) || 0,
                subtotal: Number(dadosAtuais.subtotal) || 0,
                valor_comissao: Number(dadosAtuais.comissao) || 0,
                data_registro: new Date().toISOString()
            }]);
            
            if (error) throw error;
            console.log("✅ Dados arquivados com sucesso em comissoes_oficina!");

        } catch (err) {
            console.error("Erro de persistência no Supabase:", err);
            alert("⚠️ Erro ao salvar no banco, mas o link do WhatsApp prosseguirá.");
        }

        // Constrói a mensagem padrão para o WhatsApp
        let msg = `*⚙️ RELATÓRIO DE COMISSÃO - OFICINA*\n\n`;
        msg += `👤 *Colaborador:* ${nomeColaborador}\n`;
        msg += `📌 *Nº O.S:* ${dadosAtuais.os}\n`;
        msg += `🛠️ *Serviço:* ${dadosAtuais.servico}\n`;
        msg += `💵 *Total do Serviço:* R$ ${(dadosAtuais.totalServico || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        if (dadosAtuais.os !== "Relatório Geral") {
            msg += `📊 *Taxa Administrativa (20%):* R$ ${(dadosAtuais.taxa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        }
        msg += `\n💰 *VALOR DA COMISSÃO:* *R$ ${(dadosAtuais.comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
        msg += `*Pagamento:*\n🔑 *PIX:* ${pixColaborador}\n🏦 *Banco:* ${bancoColaborador}`;

        if (telefone && telefone.length <= 11) telefone = '55' + telefone;
        window.open(`https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(msg)}`, '_blank');

        btnWhatsAppTexto.disabled = false;
        btnWhatsAppTexto.innerText = "💬 Enviar via Whats";
    };

    btnImprimirPDF.onclick = () => window.print();
});