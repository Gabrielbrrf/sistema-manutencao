/* controller_oficina.js - Orquestrador da Tela de Comissões */

// 1. MAPEAMENTO DOS ELEMENTOS DO DOM
const filtroCategoria = document.getElementById('filtroCategoria');
const selectColaborador = document.getElementById('selectColaborador');
const dadosComissao = document.getElementById('dadosComissao');
const btnWhatsAppTexto = document.getElementById('btnWhatsAppTexto');
const btnImprimirPDF = document.getElementById('btnImprimirPDF');

// 2. DISPARO INICIAL DIRETO
// Como o script está no fim do HTML, rodamos direto sem esperar o DOMContentLoaded
inicializarModuloOficina();

async function inicializarModuloOficina() {
    try {
        // Busca os contatos no banco de dados via Supabase usando seu Model
        const equipe = await OficinaModel.buscarColaboradores();
        
        // Alimenta o select com os colaboradores respeitando o filtro inicial via View
        OficinaView.atualizarSelectColaboradores(equipe, filtroCategoria.value);
    } catch (error) {
        console.error("Erro na inicialização do módulo:", error);
    }
}

// 3. EVENTO: FILTRAR COLABORADORES POR CATEGORIA/SETOR
filtroCategoria.onchange = () => {
    OficinaView.atualizarSelectColaboradores(OficinaModel.listaColaboradores, filtroCategoria.value);
};

// 4. EVENTO: CAPTURA E LEITURA EM TEMPO REAL (Ao colar ou digitar o relatório/PDF)
dadosComissao.oninput = () => {
    const textoBruto = dadosComissao.value;
    const dadosProcessados = OficinaModel.interpretarTexto(textoBruto);
    OficinaView.renderizarCampos(dadosProcessados);
};

// 5. AÇÃO: SALVAR NO BANCO E ENVIAR WHATSAPP
btnWhatsAppTexto.onclick = async () => {
    if (!selectColaborador.value) {
        alert("⚠️ Por favor, selecione um colaborador na lista antes de enviar!");
        return;
    }

    btnWhatsAppTexto.disabled = true;
    btnWhatsAppTexto.innerText = "🔄 Processando...";

    const opcaoAtiva = selectColaborador.options[selectColaborador.selectedIndex];
    const nomeColaborador = opcaoAtiva.value;
    const pixColaborador = opcaoAtiva.dataset.pix;
    const bancoColaborador = opcaoAtiva.dataset.banco;
    let telefone = opcaoAtiva.dataset.tel ? opcaoAtiva.dataset.tel.replace(/\D/g, '') : '';

    const dadosOS = OficinaModel.interpretarTexto(dadosComissao.value);

    try {
        // Salva os dados na sua tabela do Supabase
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
        console.error("Erro ao salvar:", err);
    }

    const textoMensagem = 
`*⚙️ RELATÓRIO DE COMISSÃO - OFICINA*

👤 *Colaborador:* ${nomeColaborador}
📌 *Nº O.S:* ${dadosOS.os}
🛠️ *Serviço:* ${dadosOS.servico}
💵 *Total do Serviço:* R$ ${dadosOS.totalServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📊 *Taxa Administrativa (20%):* R$ ${dadosOS.taxa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📉 *Subtotal Geral:* R$ ${dadosOS.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

💰 *VALOR DA COMISSÃO A RECEBER:* *R$ ${dadosOS.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*

*Dados Cadastrados para Pagamento:*
🔑 *Chave PIX:* ${pixColaborador}
🏦 *Instituição:* ${bancoColaborador}`;

    if (telefone && telefone.length <= 11) {
        telefone = '55' + telefone;
    }

    const urlApiWhatsApp = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(textoMensagem)}`;
    window.open(urlApiWhatsApp, '_blank');

    btnWhatsAppTexto.disabled = false;
    btnWhatsAppTexto.innerText = "💬 Enviar via Whats";
};

// 6. AÇÃO: IMPRIMIR / GERAR PDF
btnImprimirPDF.onclick = () => {
    window.print();
};