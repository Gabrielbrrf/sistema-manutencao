export const ModelNF = {
    notas: JSON.parse(localStorage.getItem('db_nfs_shb')) || [],

    adicionarNota(novaNota) {
        if (!novaNota.id) novaNota.id = Date.now().toString();
        this.notas.push(novaNota);
        this.salvarNoBanco();
    },

    excluirNota(id) {
        this.notas = this.notas.filter(nota => nota.id !== id);
        this.salvarNoBanco();
    },

    salvarNoBanco() {
        localStorage.setItem('db_nfs_shb', JSON.stringify(this.notas));
    },

    getNotasPorMes(mesSelecionado) {
        return this.notas.filter(nota => {
            if (!nota.data) return false;
            const partesData = nota.data.split('-'); 
            const mesDaNota = parseInt(partesData[1]);
            return mesDaNota === parseInt(mesSelecionado);
        });
    }
};