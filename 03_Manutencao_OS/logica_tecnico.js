/* logica_tecnico.js - EXCLUSIVO PARA O TÉCNICO */
const SUPABASE_URL = 'https://olawjagrfhcxsonmyopi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXdqYWdyZmhjeHNvbm15b3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Mzc2NTEsImV4cCI6MjA4NjUxMzY1MX0.KB-n1QyDmDarzBofPuZ-SGUSUCwJsFq9p-HV3bWWMaY';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function carregarServicosPendentes() {
    const lista = document.getElementById('lista-chamados-tecnico');
    lista.innerHTML = "Buscando serviços...";

    // Busca apenas o que você (ADM) lançou e ainda está 'Pendente'
    const { data, error } = await _supabase
        .from('ordens_servico')
        .select('*')
        .eq('status', 'Pendente')
        .order('id', { ascending: false });

    if (error) {
        lista.innerHTML = "Erro ao carregar dados.";
        return;
    }

    if (data.length === 0) {
        lista.innerHTML = "✅ Nenhum serviço pendente no momento!";
        return;
    }

    lista.innerHTML = "";
    data.forEach(os => {
        lista.innerHTML += `
            <div class="card-servico" style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 5px solid #2563eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4 style="margin:0;">📍 ${os.cliente}</h4>
                <p style="margin: 5px 0; color: #475569;"><strong>O que fazer:</strong> ${os.descricao_servico}</p>
                <small>Designado para: ${os.tecnico}</small>
                
                <button onclick="abrirFechamento(${os.id})" id="btn-abrir-${os.id}" style="width:100%; margin-top:10px; padding:10px; background:#10b981; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
                    INICIAR / FINALIZAR
                </button>

                <div id="form-fechamento-${os.id}" style="display:none; margin-top:15px; border-top: 1px dashed #ccc; padding-top:10px;">
                    <input type="number" id="mao-obra-${os.id}" placeholder="Mão de Obra R$" style="width:100%; padding:8px; margin-bottom:5px; border:1px solid #ddd; border-radius:4px;">
                    <input type="number" id="material-${os.id}" placeholder="Materiais R$" style="width:100%; padding:8px; margin-bottom:5px; border:1px solid #ddd; border-radius:4px;">
                    <label style="font-size:12px; display:block; margin-bottom:5px;">📸 Foto da NF/Recibo:</label>
                    <input type="file" id="foto-${os.id}" accept="image/*" capture="camera" style="margin-bottom:10px;">
                    <button onclick="enviarFechamento(${os.id})" style="width:100%; padding:10px; background:#2563eb; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
                        CONCLUIR SERVIÇO
                    </button>
                </div>
            </div>
        `;
    });
}

function abrirFechamento(id) {
    document.getElementById(`form-fechamento-${id}`).style.display = 'block';
    document.getElementById(`btn-abrir-${id}`).style.display = 'none';
}

async function enviarFechamento(id) {
    const valorMaoObra = document.getElementById(`mao-obra-${id}`).value;
    const valorMaterial = document.getElementById(`material-${id}`).value;
    const fotoInput = document.getElementById(`foto-${id}`);

    if (!valorMaoObra) {
        alert("Informe o valor da mão de obra!");
        return;
    }

    let fotoBase64 = "";
    if (fotoInput.files.length > 0) {
        const reader = new FileReader();
        fotoBase64 = await new Promise(resolve => {
            reader.readAsDataURL(fotoInput.files[0]);
            reader.onload = () => resolve(reader.result);
        });
    }

    const { error } = await _supabase
        .from('ordens_servico')
        .update({
            status: 'Concluido',
            valor_mao_de_obra: parseFloat(valorMaoObra),
            valor_gasto: parseFloat(valorMaterial || 0),
            foto_nf: fotoBase64,
            hora_conclusao: new Date().toISOString()
        })
        .eq('id', id);

    if (!error) {
        alert("✅ Serviço finalizado com sucesso!");
        carregarServicosPendentes();
    } else {
        alert("Erro ao salvar: " + error.message);
    }
}

window.onload = carregarServicosPendentes;
