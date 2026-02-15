/* controller_faxina.js - Integrado ao Supabase, WhatsApp e Histórico de Gastos */

window.onload = async () => {
    // 1. Sincroniza os preços do banco de dados antes de tudo
    if (typeof FaxinaModel !== 'undefined') {
        await FaxinaModel.sincronizarPrecos();

        // 2. Carrega as faxineiras da tabela 'contatos'
        const faxineiras = await FaxinaModel.buscarFaxineiras();
        const select = document.getElementById('selectFaxineira');
        
        if (!faxineiras || faxineiras.length === 0) {
            select.innerHTML = '<option value="">Nenhuma faxineira no banco</option>';
        } else {
            select.innerHTML = '<option value="">Selecione a Faxineira</option>';
            faxineiras.forEach(f => {
                let opt = document.createElement('option');
                opt.value = f.nome;
                opt.innerHTML = f.nome;
                
                // Armazena dados extras para o WhatsApp
                opt.dataset.pix = f.chave_pix || "Não cadastrado";
                opt.dataset.tel = f.telefone || "";
                opt.dataset.banco = f.banco || "Não informado";
                select.appendChild(opt);
            });
        }
    }
};

// Cálculo em tempo real ao digitar
document.getElementById('listaCodigos').addEventListener('input', (e) => {
    if (typeof FaxinaModel !== 'undefined' && typeof FaxinaView !== 'undefined') {
        const res = FaxinaModel.calcular(e.target.value);
        FaxinaView.renderizarResultado(res);
    }
});

// Salvar novos preços ou editar direto no Supabase
async function salvarPreco() {
    const cod = document.getElementById('novoCod').value;
    const preco = document.getElementById('novoPreco').value;
    
    if (cod && preco && typeof FaxinaModel !== 'undefined') {
        await FaxinaModel.salvarNovoPrecoNoBanco(cod, preco);
        alert(`Sucesso! ${cod.toUpperCase()} atualizado no banco.`);
        
        document.getElementById('novoCod').value = "";
        document.getElementById('novoPreco').value = "";
        
        const res = FaxinaModel.calcular(document.getElementById('listaCodigos').value);
        FaxinaView.renderizarResultado(res);
    } else {
        alert("Preencha o código e o valor!");
    }
}

// Gerar Comprovante, Salvar no Banco e enviar para o WhatsApp
document.getElementById('btnGerarComprovante').addEventListener('click', async () => {
    const select = document.getElementById('selectFaxineira');
    const opcaoSel = select.options[select.selectedIndex];
    
    const totalTexto = document.getElementById('valorTotal').innerText;
    // Converte "R$ 150,00" em número decimal (150.00) para o banco
    const totalNumerico = parseFloat(totalTexto.replace('R$', '').replace('.', '').replace(',', '.').trim());
    
    const aptos = document.getElementById('listaCodigos').value.toUpperCase();
    const cidade = document.getElementById('cidadeFaxina').value;
    const tipo = document.getElementById('tipoFaxina').value;

    if (!opcaoSel || !opcaoSel.value || totalNumerico === 0) {
        return alert("Selecione a faxineira e insira códigos válidos!");
    }

    // --- NOVIDADE: GRAVANDO NO HISTÓRICO ---
    const { error } = await _supabase
        .from('pagamentos_realizados')
        .insert([{
            nome_faxineira: opcaoSel.value,
            cidade: cidade,
            tipo_contrato: tipo,
            valor_total: totalNumerico,
            apartamentos: aptos
        }]);

    if (error) {
        console.error("Erro ao salvar no histórico:", error);
    } else {
        console.log("Pagamento registrado no banco com sucesso!");
    }
    // ---------------------------------------

    const nome = opcaoSel.value;
    const pix = opcaoSel.dataset.pix;
    const banco = opcaoSel.dataset.banco;
    
    let tel = opcaoSel.dataset.tel ? opcaoSel.dataset.tel.replace(/\D/g, '') : "";
    if (tel.length === 11) tel = "55" + tel;

    const mensagem = `*PAGAMENTO FAXINA - SUPER HOST*%0A%0A` +
                     `Olá ${nome}! 👋%0A%0A` +
                     `*Resumo do Serviço:*%0A` +
                     `🏠 Aptos: ${aptos}%0A` +
                     `💰 *Total a receber: ${totalTexto}*%0A%0A` +
                     `*Dados para o Pix:*%0A` +
                     `🔑 Chave: ${pix}%0A` +
                     `🏦 Banco: ${banco}%0A%0A` +
                     `Por favor, confirme se os dados estão corretos!`;

    // Abre na aba inteligente
    window.open(`https://api.whatsapp.com/send?phone=${tel}&text=${mensagem}`, 'whatsapp_janela');
});