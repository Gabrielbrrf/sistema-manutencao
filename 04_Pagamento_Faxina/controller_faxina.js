/* controller_faxina.js - Versão Definitiva Sincronizada com a Tabela Contatos */

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
            // Faz a requisição direto na tabela apontada no print do Supabase
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

    // 2. ATUALIZAÇÃO DOS CAMPOS DA INTERFACE (VIEW INTEGRADA)
    function atualizarTelaDinamica() {
        const opcaoAtiva = selectColaborador.options[selectColaborador.selectedIndex];
        const nome = selectColaborador.value ? selectColaborador.value : "-";
        const pix = (opcaoAtiva && opcaoAtiva.dataset.pix) ? opcaoAtiva.dataset.pix : "Não cadastrado";

        // Atualiza os elementos do DOM do index.html
        document.getElementById('resColaborador').textContent = nome;
        document.getElementById('resOS').textContent = dadosAtuais.os || "-";
        document.getElementById('resServico').textContent = dadosAtuais.servico || "-";
        document.getElementById('resTotalServico').textContent = `R$ ${(Number(dadosAtuais.totalServico) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('resTaxa').textContent = `- R$ ${(Number(dadosAtuais.taxa) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('valorTotalComissao').textContent = `R$ ${(Number(dadosAtuais.comissao) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('infoPixRecibo').textContent = `Destino: PIX ${pix}`;
    }

    // 3. LEITURA BRUTA E PARSER DO TEXTO DO PDF
    function interpretarTextoOficina(texto) {
        const resultado = {
            os: "Relatório Geral",
            servico: "Geral / Oficina",
            totalServico: 0,
            taxa: 0,
            subtotal: 0,
            comissao: 0,
            nomeColaboradorPdf: ""
        };

        if (!texto) return resultado;

        // Procura pelo nome do funcionário nas primeiras linhas do PDF
        const linhas = texto.split('\n');
        for (let linha of linhas) {
            if (linha.toUpperCase().includes('MARCO')) {
                // Remove numeração comum que vem antes (Ex: "16- MARCO...")
                resultado.nomeColaboradorPdf = linha.replace(/^\d+-\s*/, '').trim();
                break;
            }
        }

        // Procura os valores de fechamento (SubTotal ou Total Geral)
        const regexValores = /(?:SubTotal|Total\s+Geral)[^\d]*([\d.,]+)[^\d]+([\d.,]+)/i;
        const matchValores = texto.match(regexValores);

        if (matchValores) {
            const bruto = parseFloat(matchValores[1].replace(/\./g, '').replace(',', '.'));
            const comis = parseFloat(matchValores[2].replace(/\./g, '').replace(',', '.'));
            
            resultado.totalServico = bruto;
            resultado.taxa = bruto * 0.20; 
            resultado.subtotal = bruto;
            resultado.comissao = comis; 
        } else {
            // Fallback: Busca o último valor em formato de dinheiro se a estrutura falhar
            const valoresDinheiro = texto.match(/([\d.]+,\d{2})/g);
            if (valoresDinheiro && valoresDinheiro.length >= 2) {
                const comis = parseFloat(valoresDinheiro[valoresDinheiro.length - 1].replace(/\./g, '').replace(',', '.'));
                const bruto = parseFloat(valoresDinheiro[valoresDinheiro.length - 2].replace(/\./g, '').replace(',', '.'));
                resultado.totalServico = bruto;
                resultado.taxa = bruto * 0.20;
                resultado.comissao = comis;
            }
        }
        return resultado;
    }

    // 4. MECANISMO DE DRAG / UPLOAD DO ARQUIVO PDF
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
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;
                    
                    let textoCompleto = "";

                    // Varre as páginas extraindo os itens textuais de forma simples e direta
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const pagina = await pdf.getPage(i);
                        const conteudo = await pagina.getTextContent();
                        const textoPagina = conteudo.items.map(item => item.str).join(" ");
                        textoCompleto += textoPagina + "\n";
                    }

                    // Força a exibição de todo o texto no textarea para conferência
                    dadosComissao.value = textoCompleto.trim();
                    
                    // Executa o interpretador inteligente
                    dadosAtuais = interpretarTextoOficina(textoCompleto);

                    // Vincula o Colaborador Automaticamente (Mesmo se houver erro de digitação de letras)
                    if (dadosAtuais.nomeColaboradorPdf) {
                        const nomeInjetado = dadosAtuais.nomeColaboradorPdf.toLowerCase().replace(/[^a-z]/g, '');
                        
                        for (let option of selectColaborador.options) {
                            if (!option.value) continue;
                            const nomeOpcao = option.value.toLowerCase().replace(/[^a-z]/g, '');
                            
                            // Se um nome contiver o outro (Trata o caso "BERNADO" vs "BERNARDO")
                            if (nomeInjetado.includes(nomeOpcao) || nomeOpcao.includes(nomeInjetado) || nomeInjetado.substring(0, 5) === nomeOpcao.substring(0, 5)) {
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

    function resetarBotao() {
        btnUploadPdf.innerText = "📁 Escolher PDF da OS";
        btnUploadPdf.style.background = "#4f46e5";
    }

    // 5. EVENTOS DE INTERAÇÃO DOS FILTROS E INPUTS
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
            // Salva na tabela de relatórios
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

        // Formata a mensagem do WhatsApp
        let msg = `*⚙️ RELATÓRIO DE COMISSÃO - OFICINA*\n\n`;
        msg += `👤 *Colaborador:* ${nomeColaborador}\n`;
        msg += `📌 *Documento:* ${dadosAtuais.os}\n`;
        msg += `🛠️ *Serviço:* ${dadosAtuais.servico}\n`;
        msg += `💵 *Volume Bruto:* R$ ${(dadosAtuais.totalServico || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        msg += `📊 *Retenção Operacional (20%):* R$ ${(dadosAtuais.taxa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
        msg += `💰 *VALOR DA COMISSÃO:* *R$ ${(dadosAtuais.comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
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