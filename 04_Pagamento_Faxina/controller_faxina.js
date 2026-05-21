/* controller_faxina.js - Mecanismo de Upload e Controle */

// Aponta o Worker do PDF.js para a CDN estável
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

document.addEventListener("DOMContentLoaded", () => {
    const filtroCategoria = document.getElementById('filtroCategoria');
    const selectColaborador = document.getElementById('selectColaborador');
    const dadosComissao = document.getElementById('dadosComissao');
    const btnWhatsAppTexto = document.getElementById('btnWhatsAppTexto');
    const btnImprimirPDF = document.getElementById('btnImprimirPDF');
    
    // Elementos de Upload do PDF
    const btnUploadPdf = document.getElementById('btnUploadPdf');
    const inputPdf = document.getElementById('inputPdf');
    const nomeArquivoPdf = document.getElementById('nomeArquivoPdf');

    // Executa a carga inicial da equipe
    inicializarMódulo();

    async function inicializarMódulo() {
        try {
            const equipe = await OficinaModel.buscarColaboradores();
            OficinaView.atualizarSelectColaboradores(equipe, filtroCategoria.value);
            console.log("✅ Equipe carregada via Model!");
        } catch (err) {
            console.error("Erro na inicialização:", err);
            selectColaborador.innerHTML = "<option>❌ Erro ao carregar equipe</option>";
        }
    }

    // ==========================================
    // CAPTURA E PROCESSAMENTO DIRETOS DO PDF
    // ==========================================
    if (btnUploadPdf && inputPdf) {
        btnUploadPdf.onclick = () => inputPdf.click();

        inputPdf.onchange = async (e) => {
            const arquivo = e.target.files[0];
            if (!arquivo) return;

            nomeArquivoPdf.textContent = arquivo.name;
            btnUploadPdf.innerText = "🔄 Lendo PDF...";
            btnUploadPdf.style.background = "#d97706";

            try {
                const fileReader = new FileReader();
                fileReader.onload = async function (event) {
                    try {
                        const arrayBuffer = new Uint8Array(event.target.result);
                        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                        let textoCompleto = "";

                        // Varre as páginas do PDF extraindo as strings de texto
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const pagina = await pdf.getPage(i);
                            const conteudo = await pagina.getTextContent();
                            const textoLinha = conteudo.items.map(item => item.str).join(" ");
                            textoCompleto += textoLinha + "\n";
                        }

                        // Joga o texto bruto na caixa de texto
                        dadosComissao.value = textoCompleto;

                        // Roda as expressões regulares do Model e renderiza na View
                        const dadosFormatados = OficinaModel.interpretarTexto(textoCompleto);
                        OficinaView.renderizarCampos(dadosFormatados);

                        btnUploadPdf.innerText = "✅ PDF Processado!";
                        btnUploadPdf.style.background = "#059669";

                    } catch (pdfError) {
                        console.error("Erro ao descriptografar texto do PDF:", pdfError);
                        alert("Não foi possível extrair o texto automaticamente. Copie o texto do arquivo e cole na caixa.");
                        resetarBotao();
                    }
                };
                fileReader.readAsArrayBuffer(arquivo);

            } catch (err) {
                console.error("Erro no leitor de arquivos:", err);
                resetarBotao();
            }
        };
    }

    function resetarBotao() {
        btnUploadPdf.innerText = "📁 Escolher PDF da OS";
        btnUploadPdf.style.background = "#4f46e5";
    }

    // ==========================================
    // EVENTOS DE INTERFACE
    // ==========================================
    filtroCategoria.onchange = () => {
        OficinaView.atualizarSelectColaboradores(OficinaModel.listaColaboradores, filtroCategoria.value);
    };

    dadosComissao.oninput = () => {
        const dadosProcessados = OficinaModel.interpretarTexto(dadosComissao.value);
        OficinaView.renderizarCampos(dadosProcessados);
    };

    btnWhatsAppTexto.onclick = async () => {
        if (!selectColaborador.value) {
            alert("⚠️ Selecione um colaborador primeiro!");
            return;
        }

        btnWhatsAppTexto.disabled = true;
        btnWhatsAppTexto.innerText = "🔄 Gravando...";

        const opcaoAtiva = selectColaborador.options[selectColaborador.selectedIndex];
        const nomeColaborador = opcaoAtiva.value;
        const pixColaborador = opcaoAtiva.dataset.pix || 'Não informado';
        const bancoColaborador = opcaoAtiva.dataset.banco || 'Não informado';
        let telefone = opcaoAtiva.dataset.tel ? opcaoAtiva.dataset.tel.replace(/\D/g, '') : '';

        const dadosOS = OficinaModel.interpretarTexto(dadosComissao.value);

        try {
            await _supabase.from('comissoes_oficina').insert([{
                colaborador: nomeColaborador,
                numero_os: dadosOS.os,
                servico: dadosOS.servico,
                total_servico: dadosOS.totalServico,
                taxa_administrativa: dadosOS.taxa,
                subtotal: dadosOS.subtotal,
                valor_comissao: dadosOS.comissao,
                data_registro: new Date().toISOString()
            }]);
        } catch (err) {
            console.error("Erro Supabase:", err);
        }

        const msg = `*⚙️ RELATÓRIO DE COMISSÃO - OFICINA*\n\n👤 *Colaborador:* ${nomeColaborador}\n📌 *Nº O.S:* ${dadosOS.os}\n🛠️ *Serviço:* ${dadosOS.servico}\n💵 *Total do Serviço:* R$ ${dadosOS.totalServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📊 *Taxa Administrativa (20%):* R$ ${dadosOS.taxa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📉 *Subtotal Geral:* R$ ${dadosOS.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n💰 *VALOR DA COMISSÃO:* *R$ ${dadosOS.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n*Pagamento:*\n🔑 *PIX:* ${pixColaborador}\n🏦 *Banco:* ${bancoColaborador}`;

        if (telefone && telefone.length <= 11) telefone = '55' + telefone;
        window.open(`https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(msg)}`, '_blank');

        btnWhatsAppTexto.disabled = false;
        btnWhatsAppTexto.innerText = "💬 Enviar via Whats";
    };

    btnImprimirPDF.onclick = () => window.print();
});