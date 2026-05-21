/* view_oficina.js - Renderização Fixa na Tela */

const OficinaView = {
    renderizarCampos(dados) {
        document.getElementById('resOS').innerText = dados.os;
        document.getElementById('resServico').innerText = dados.servico;
        document.getElementById('resPronto').innerText = dados.pronto;
        document.getElementById('resSaida').innerText = dados.saida;
        
        document.getElementById('resTotalServico').innerText = this.formatarBRL(dados.totalServico);
        document.getElementById('resTaxa').innerText = this.formatarBRL(dados.taxa);
        document.getElementById('resSubtotal').innerText = this.formatarBRL(dados.subtotal);
        
        // Campo principal de recebimento destacado
        document.getElementById('valorTotalComissao').innerText = this.formatarBRL(dados.comissao);
    },

    atualizarSelectColaboradores(lista, categoriaSelecionada = "TODOS") {
        const select = document.getElementById('selectColaborador');
        select.innerHTML = '<option value="">Selecione o Colaborador</option>';

        // Filtra conforme a categoria se não for "TODOS"
        const filtrados = categoriaSelecionada === "TODOS" 
            ? lista 
            : lista.filter(c => c.categoria === categoriaSelecionada);

        filtrados.forEach(f => {
            let opt = document.createElement('option');
            opt.value = f.nome;
            opt.innerText = f.nome;
            opt.dataset.pix = f.chave_pix || "Não cadastrado";
            opt.dataset.tel = f.telefone || "";
            opt.dataset.banco = f.banco || "Não informado";
            select.appendChild(opt);
        });
    },

    formatarBRL(valor) {
        return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
};