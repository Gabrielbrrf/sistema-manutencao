/* controller_faxina.js - Mecanismo de Upload Espacial e Controle do Recibo */

// Garante o vínculo com o worker carregado no HTML
if (typeof window['pdfjs-dist/build/pdf'] !== 'undefined') {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
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

    function atualizarTelaDinamica() {
        const opcaoAtiva = selectColaborador.options[selectColaborador.selectedIndex];
        const nome = selectColaborador.value ? selectColaborador.value : "-";
        const pix = (opcaoAtiva && opcaoAtiva.dataset.pix) ? opcaoAtiva.dataset.pix : "Não informado";
        
        OficinaView.renderizarCampos(dadosAtuais, nome, pix);
    }

    if (btnUploadPdf && inputPdf) {
        btnUploadPdf.onclick = () => inputPdf.click();

        inputPdf.onchange = async (e) => {
            const arquivo = e.target.files[0];
            if (!arquivo) return;

            nomeArquivoPdf.textContent = arquivo.name;
            btnUploadPdf.innerText = "🔄 Carregando PDF...";
            btnUploadPdf.style.background = "#d97706";

            const fileReader = new FileReader();
            fileReader.onload = async function (event) {
                try {
                    const arrayBuffer = new Uint8Array(event.target.result);
                    
                    // Inicialização da biblioteca usando a instância global do objeto do navegador
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;
                    
                    let textoCompleto = "";

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const pagina = await pdf.getPage(i);
                        const conteudo = await pagina.getTextContent();
                        
                        // Mapeamento e ordenação espacial das strings
                        const itensMapeados = [...conteudo.items].sort((a, b) => {
                            if (Math.abs(a.transform[5] - b.transform[5]) > 15) {
                                return b.transform[5] - a.transform[5]; 
                            }
                            return a.transform[4] - b.transform[4]; 
                        });

                        let textoPagina = "";
                        let ultimoY = null;

                        for (const item of itensMapeados) {
                            if (!item.str) continue;

                            if (ultimoY !== null && Math.abs(item.transform[5] - ultimoY) > 15) {
                                textoPagina += "\n";
                            } else if (textoPagina !== "" && !textoPagina.endsWith("\n") && !textoPagina.endsWith(" ")) {
                                textoPagina += " ";
                            }
                            textoPagina += item.str;
                            ultimoY = item.transform[5];
                        }
                        textoCompleto += textoPagina + "\n";
                    }

                    if (!textoCompleto.trim() || textoCompleto.trim() === "Pag. 1 de 1") {
                        // Plano B imediato caso a ordenação espacial falhe no layout do relatório
                        let textoPlanoB = "";
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const pagina = await pdf.getPage(i);
                            const conteudo = await pagina.getTextContent();
                            textoPlanoB += conteudo.items.map(item => item.str).join(" ") + "\n";
                        }
                        textoCompleto = textoPlanoB;
                    }

                    dadosComissao.value = textoCompleto.trim();
                    dadosAtuais = OficinaModel.interpretarTexto(textoCompleto);

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

                    atualizarTelaDinamica();
                    btnUploadPdf.innerText = "✅ PDF Processado!";
                    btnUploadPdf.style.background = "#059669";

                } catch (pdfError) {
                    console.error("Erro interno no processamento do PDF:", pdfError);
                    alert("Erro ao ler o conteúdo interno do arquivo: " + pdfError.message);
                    resetarBotao();
                }
            };
            
            fileReader.onerror = function(err) {
                alert("Erro no leitor de arquivos do navegador.");
                resetarBotao();
            };
            
            fileReader.readAsArrayBuffer(arquivo);
        };
    }

    function resetarBotao() {
        btnUploadPdf.innerText = "📁 Escolher PDF da OS";
        btnUploadPdf.style.background = "#4f46e5";
    }

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
            console.log("✅ Dados salvos com sucesso!");

        } catch (err) {
            console.error("Erro no Supabase:", err);
        }

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