/* view_faxina.js - Renderização do Layout da Oficina */

const OficinaView = {
    atualizarSelectColaboradores(lista, setor) {
        const selectColaborador = document.getElementById('selectColaborador');
        selectColaborador.innerHTML = '<option value="">Selecione o Colaborador...</option>';

        lista.forEach(colab => {
            if (setor !== 'TODOS' && colab.categoria !== setor) return;

            const option = document.createElement('option');
            option.value = colab.nome;
            option.textContent = colab.nome;
            option.dataset.pix = colab.pix || '';
            option.dataset.banco = colab.banco || '';
            option.dataset.tel = colab.telefone || '';
            
            selectColaborador.appendChild(option);
        });
    },

    renderizarCampos(dados) {
        document.getElementById('resOS').textContent = dados.os;
        document.getElementById('resServico').textContent = dados.servico;
        document.getElementById('resPronto').textContent = dados.pronto;
        document.getElementById('resSaida').textContent = dados.saida;
        
        document.getElementById('resTotalServico').textContent = `R$ ${dados.totalServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('resTaxa').textContent = `R$ ${dados.taxa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('resSubtotal').textContent = `R$ ${dados.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('valorTotalComissao').textContent = `R$ ${dados.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
};