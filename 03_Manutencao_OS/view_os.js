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
        container.innerHTML = ordens.length ? "" : "<p style='text-align:center; color:#666;'>Nenhuma OS realizada hoje.</p>";
        
        ordens.forEach(os => {
            // Formata Data (Ex: 15/02)
            const dataF = os.data_execucao ? os.data_execucao.split('-').reverse().slice(0,2).join('/') : "--/--";
            
            // Formata Horas (Ex: 14:30)
            const hInicio = os.hora_inicio ? new Date(os.hora_inicio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : "--:--";
            const hFim = os.hora_conclusao ? new Date(os.hora_conclusao).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : "--:--";

            // Calcula Duração do Trabalho
            let duracaoTexto = "";
            if (os.hora_inicio && os.hora_conclusao) {
                const diff = new Date(os.hora_conclusao) - new Date(os.hora_inicio);
                const minutos = Math.floor(diff / 60000);
                duracaoTexto = minutos > 60 
                    ? `${Math.floor(minutos/60)}h ${minutos%60}min` 
                    : `${minutos} min`;
            }

            // Cor por cidade: Santos (Azul) / Guarujá (Roxo)
            const corCidade = os.cidade?.toLowerCase() === 'santos' ? '#007bff' : '#6f42c1';
            
            // LÓGICA DA NOTA FISCAL: Mostra o botão verde apenas se tiraram foto
            const botaoNF = os.foto_nf 
                ? `<button onclick="ManutencaoView.abrirModalNF('${os.foto_nf}')" style="background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; margin-top: 8px; font-weight: bold;">📄 VER NOTA (R$ ${os.valor_gasto || '0,00'})</button>` 
                : "";

            container.insertAdjacentHTML('beforeend', `
                <div class="card" style="border-left: 5px solid ${corCidade}; margin-bottom: 12px; padding: 15px; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); color: #333;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <strong style="font-size: 15px; color: #1e293b;">${os.tecnico}</strong> 
                            <span style="font-size: 12px; color: #64748b;"> • ${os.cidade?.toUpperCase()} (${os.apto})</span><br>
                            
                            <p style="margin: 5px 0; font-size: 14px; color: #475569;">${os.descricao_servico}</p>
                            
                            <div style="margin-top: 8px; font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 8px;">
                                <span>📅 <b>${dataF}</b></span>
                                <span>🕒 <b>${hInicio} às ${hFim}</b></span>
                                <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #4338ca; font-weight: bold;">
                                    ⏱️ ${duracaoTexto}
                                </span>
                            </div>
                            ${botaoNF}
                        </div>
                        <button onclick="ManutencaoController.deletarOS('${os.id}')" style="background: #fff1f2; border: none; color: #e11d48; cursor: pointer; font-size: 16px; padding: 8px; border-radius: 8px; margin-left: 10px;">🗑️</button>
                    </div>
                </div>
            `);
        });
    },

    // Abre a imagem da nota fiscal em tela cheia
    abrirModalNF(base64) {
        const novaJanela = window.open();
        novaJanela.document.write(`
            <html>
                <body style="margin:0; background: #000; display: flex; align-items: center; justify-content: center;">
                    <img src="${base64}" style="max-width: 100%; max-height: 100vh; object-fit: contain;" />
                </body>
            </html>
        `);
    }
};
