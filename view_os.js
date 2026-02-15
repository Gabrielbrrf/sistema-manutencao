/* view_os.js */
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
            
            // Formata Horas (pega apenas HH:mm)
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

            const corCidade = os.cidade?.toLowerCase() === 'santos' ? '#007bff' : '#6f42c1';
            
            container.insertAdjacentHTML('beforeend', `
                <div class="card" style="border-left: 5px solid ${corCidade}; margin-bottom: 12px; padding: 12px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <strong style="font-size: 16px;">${os.tecnico}</strong> - ${os.cidade?.toUpperCase()} (${os.apto})<br>
                            <span style="color: #666; font-size: 13px;">${os.descricao_servico}</span><br>
                            <div style="margin-top: 5px; font-size: 12px; color: #444;">
                                📅 <b>${dataF}</b> | 🕒 <b>${hInicio} às ${hFim}</b> 
                                <span style="background: #eef2ff; padding: 2px 6px; border-radius: 4px; margin-left: 5px; color: #4338ca;">
                                    ⏱️ ${duracaoTexto}
                                </span>
                            </div>
                        </div>
                        <button onclick="ManutencaoController.deletarOS('${os.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 18px;">🗑️</button>
                    </div>
                </div>
            `);
        });
    }
};