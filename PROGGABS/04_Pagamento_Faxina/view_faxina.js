const FaxinaView = {
    renderizarResultado(res) {
        const displayTotal = document.getElementById('valorTotal');
        const displayQtd = document.getElementById('qtdAptos');
        const displayErros = document.getElementById('alertaErro');

        displayTotal.innerText = `R$ ${res.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        displayQtd.innerText = res.qtd;

        if (res.invalidos.length > 0) {
            displayErros.innerHTML = `⚠️ Cód. não reconhecidos: <br><strong>${res.invalidos.join(', ')}</strong>`;
            displayErros.style.display = "block";
        } else {
            displayErros.style.display = "none";
        }
    },

    limpar() {
        document.getElementById('listaCodigos').value = "";
        this.renderizarResultado({ total: 0, qtd: 0, invalidos: [] });
    }
};