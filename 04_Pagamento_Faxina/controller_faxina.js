/* controller_oficina.js - Orquestrador da Tela de Comissões */

// 1. MAPEAMENTO DOS ELEMENTOS DO DOM
const filtroCategoria = document.getElementById('filtroCategoria');
const selectColaborador = document.getElementById('selectColaborador');
const dadosComissao = document.getElementById('dadosComissao');
const btnWhatsAppTexto = document.getElementById('btnWhatsAppTexto');
const btnImprimirPDF = document.getElementById('btnImprimirPDF');

// 2. DISPARO INICIAL (Carrega a equipe ao abrir a página)
document.addEventListener('DOMContentLoaded', inicializarModuloOficina);

async function inicializarModuloOficina() {
    // Busca os contatos no banco de dados via Supabase usando seu Model
    const equipe = await OficinaModel.buscarColaboradores();
    
    // Alimenta o select com os colaboradores respeitando o filtro inicial via View
    OficinaView.atualizarSelectColaboradores(equipe, filtroCategoria.value);
}

// 3. EVENTO: FILTRAR COLABORADORES POR CATEGORIA/SETOR
filtroCategoria.onchange = () => {
    // Filtra dinamicamente a equipe sem precisar fazer outra requisição ao banco
    OficinaView.atualizarSelectColaboradores(OficinaModel.listaColaboradores, filtroCategoria.value);
};

// 4. EVENTO: CAPTURA E LEITURA EM TEMPO REAL (Ao colar ou digitar o relatório)
dadosComissao.oninput = () => {
    const textoBruto = dadosComissao.value;
    
    // Executa o interpretador do Model para extrair os valores da OS
    const dadosProcessados = OficinaModel.interpretarTexto(textoBruto);
    
    // Passa o objeto estruturado para a View atualizar a tela
    OficinaView.renderizarCampos(dadosProcessados);
};

// 5. AÇÃO: SALVAR NO BANCO E ENVIAR WHATSAPP
btnWhatsAppTexto.onclick = async () => {
    // Validação: Verifica se o usuário escolheu um colaborador
    if (!selectColaborador.value) {
        alert("⚠️ Por favor, selecione um colaborador na lista antes de enviar!");
        return;
    }

    // Desativa o botão temporariamente para evitar cliques duplos
    btnWhatsAppTexto.disabled = true;
    btnWhatsAppTexto.innerText = "🔄 Processando e Salvando...";

    // Captura a opção ativa dentro do select para extrair os datasets injetados pela View
    const opcaoAtiva = selectColaborador.options[selectColaborador.selectedIndex];
    const nomeColaborador = opcaoAtiva.value;
    const pixColaborador = opcaoAtiva.dataset.pix;
    const bancoColaborador = opcaoAtiva.dataset.banco;
    
    // Limpa o número do telefone deixando apenas os dígitos numéricos
    let telefone = opcaoAtiva.dataset.tel ? opcaoAtiva.dataset.tel.replace(/\D/g, '') : '';

    // Recupera em tempo real os dados extraídos do texto colado
    const dadosOS = OficinaModel.interpretarTexto(dadosComissao.value);

    try {
        // Envia os dados diretamente para a tabela 'comissoes_oficina' no seu Supabase
        const { error } = await _supabase
            .from('comissoes_oficina')
            .insert([{
                colaborador: nomeColaborador,
                numero_os: dadosOS.os,
                servico: dadosOS.servico,
                total_servico: dadosOS.totalServico,
                taxa_administrativa: dadosOS.taxa,
                subtotal: dadosOS.subtotal,
                valor_comissao: dadosOS.comissao,
                data_registro: new Date().toISOString()
            }]);

        if (error) {
            console.error("Erro ao salvar no Supabase:", error);
            alert("⚠️ Os dados não foram salvos no histórico, mas o WhatsApp será aberto.");
        }
    } catch (err) {
        console.error("Erro inesperado:", err);
    }

    // Montagem da mensagem estruturada para o WhatsApp
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

    // Adiciona o DDI do Brasil (55) caso o telefone tenha apenas o DDD e o número
    if (telefone && telefone.length <= 11) {
        telefone = '55' + telefone;
    }

    // Monta o link oficial e abre o WhatsApp em uma nova aba
    const urlApiWhatsApp = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(textoMensagem)}`;
    window.open(urlApiWhatsApp, '_blank');

    // Restaura o estado original do botão
    btnWhatsAppTexto.disabled = false;
    btnWhatsAppTexto.innerText = "💬 Enviar via Whats";
};

// 6. AÇÃO: IMPRIMIR / GERAR PDF
btnImprimirPDF.onclick = () => {
    // Abre a tela de impressão nativa do sistema operacional
    window.print();
};