/* view_os.js - Atualizada com suporte a NF e Valor Gasto */
const ManutencaoView = {
    renderizarTecnicos(nomes) {
        const select = document.getElementById('tecnicoOS');
        if (!select) return;
        select.innerHTML = '<option value="">Técnico</option>';
        nomes.forEach(nome => {
            let opt = document.createElement('option');
            opt.value = nome;
            opt.textContent = nome;
            select.appendChild(opt);
        });
    },

    renderizarLista(ordens) {
        const container = document.getElementById('conteudoLista');
        if (!container) return;
        container.innerHTML = ordens.length ? "" : "<p>Nenhuma OS realizada.</p>";
        
        ordens.forEach(os => {
            // Formata Data
            const dataF = os.data_execucao ? os.data_execucao.split('-').reverse().slice(0,2).join('/') : "--/--";
            
            // Formata Horas
            const hInicio = os.hora_inicio ? new Date(os.hora_inicio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : "--:--";
            const hFim = os.hora_conclusao ? new Date(os.hora_conclusao).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : "--:--";

            // Calcula Duração
            let duracaoTexto = "";
            if (os.hora_inicio && os.hora_conclusao) {
                const diff = new Date(os.hora_conclusao) - new Date(os.hora_inicio);
                const minutos = Math.floor(diff / 60000);
                duracaoTexto = minutos > 60 
                    ? `${Math.floor(minutos/60)}h ${minutos%60}min` 
                    : `${minutos} min`;
            }

            // Define cor por cidade (Mantendo seu padrão)
            const corCidade = os.cidade?.toLowerCase() === 'santos' ? '#007bff' : '#6f42c1';
            
            // LÓGICA DA NOTA FISCAL: Se tiver foto_nf, mostra o botão de ver nota
            const botaoNF = os.foto_nf 
                ? `<button onclick="ManutencaoView.abrirModalNF('${os.foto_nf}')" style="background: #27ae60; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-top: 5px;">📄 VER NOTA (R$ ${os.valor_gasto || '0,00'})</button>` 
                : "";

            container.insertAdjacentHTML('beforeend', `
                <div class="card" style="border-left: 5px solid ${corCidade}; margin-bottom: 12px; padding: 12px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); color: #333;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <strong style="font-size: 16px;">${os.tecnico}</strong> - ${os.cidade?.toUpperCase()} (${os.apto})<br>
                            <span style="color: #666; font-size: 13px;">${os.descricao_servico}</span><br>
                            
                            <div style="margin-top: 5px; font-size: 12px; color: #444;">
                                📅 <b>${dataF}</b> | 🕒 <b>${hInicio} às ${hFim}</b> 
                                <span style="background: #eef2ff; padding: 2px 6px; border-radius: 4px; margin-left: 5px; color: #4338ca;">
                                    ⏱️ ${duracaoTexto}
                                </span>
                            </div>
                            ${botaoNF}
                        </div>
                        <button onclick="ManutencaoController.deletarOS('${os.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 18px; margin-left: 10px;">🗑️</button>
                    </div>
                </div>
            `);
        });
    },

    // Função para abrir a imagem da NF em uma nova aba ou modal
    abrirModalNF(base64) {
        const novaJanela = window.open();
        novaJanela.document.write(`<img src="${base64}" style="max-width: 100%; height: auto;" />`);
    }
};