/* controller_oficina.js - Execução Direta e Segura */

// 1. MAPEAMENTO DOS ELEMENTOS DO DOM
const filtroCategoria = document.getElementById('filtroCategoria');
const selectColaborador = document.getElementById('selectColaborador');
const dadosComissao = document.getElementById('dadosComissao');
const btnWhatsAppTexto = document.getElementById('btnWhatsAppTexto');
const btnImprimirPDF = document.getElementById('btnImprimirPDF');

// 2. INICIALIZAÇÃO IMEDIATA (Sem travar em eventos do navegador)
(async function inicializarModuloOficina() {
    console.log("🚀 Inicializando módulo da oficina...");

    if (typeof _supabase === 'undefined') {
        selectColaborador.innerHTML = "<option>❌ ERRO: _supabase não encontrado</option>";
        return;
    }
    if (typeof OficinaModel === 'undefined') {
        selectColaborador.innerHTML = "<option>❌ ERRO: model_oficina.js não carregou</option>";
        return;
    }
    if (typeof OficinaView === 'undefined') {
        selectColaborador.innerHTML = "<option>❌ ERRO: view_oficina.js não carregou</option>";
        return;
    }

    try {
        const equipe = await OficinaModel.buscarColaboradores();
        
        if (!equipe || equipe.length === 0) {
            selectColaborador.innerHTML = "<option>⚠️ Banco retornou zero colaboradores</option>";
            return;
        }
        
        OficinaView.atualizarSelectColaboradores(equipe, filtroCategoria.value);
        console.log("✅ Equipe carregada com sucesso!");

    } catch (error) {
        console.error("Erro crítico na carga:", error);
        selectColaborador.innerHTML = `<option>❌ ERRO: ${error.message}</option>`;
    }
})();

// 3. EVENTO: FILTRAR COLABORADORES
filtroCategoria.onchange = () => {
    OficinaView.atualizarSelectColaboradores(OficinaModel.listaColaboradores, filtroCategoria.value);
};

// 4. EVENTO: LEITURA DO TEXTO COPIADO DO PDF
dadosComissao.oninput = () => {
    const dadosProcessados = OficinaModel.interpretarTexto(dadosComissao.value);
    OficinaView.renderizarCampos(dadosProcessados);
};

// 5. AÇÃO: SALVAR NO BANCO E ENVIAR WHATSAPP
btnWhatsAppTexto.onclick = async () => {
    if (!selectColaborador.value || selectColaborador.value.includes('❌') || selectColaborador.value.includes('Carregando')) {
        alert("⚠️ Selecione um colaborador válido antes de enviar!");
        return;
    }

    btnWhatsAppTexto.disabled = true;
    btnWhatsAppTexto.innerText = "🔄 Processando...";

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
        console.error("Erro ao salvar no Supabase:", err);
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

    window.open(`https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(textoMensagem)}`, '_blank');

    btnWhatsAppTexto.disabled = false;
    btnWhatsAppTexto.innerText = "💬 Enviar via Whats";
};

btnImprimirPDF.onclick = () => window.print();