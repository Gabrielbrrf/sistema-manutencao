
/* controller_adm.js - EXCLUSIVO DA GABS */
const SUPABASE_URL = 'https://olawjagrfhcxsonmyopi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXdqYWdyZmhjeHNvbm15b3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Mzc2NTEsImV4cCI6MjA4NjUxMzY1MX0.KB-n1QyDmDarzBofPuZ-SGUSUCwJsFq9p-HV3bWWMaY';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function criarOS() {
    const cliente = document.getElementById('cliente').value;
    const descricao = document.getElementById('descricao').value;
    const tecnico = document.getElementById('tecnico_select').value;

    if (!cliente || !descricao || !tecnico) {
        alert("Preencha tudo, Gabs!");
        return;
    }

    const { error } = await _supabase.from('ordens_servico').insert([{ 
        cliente, descricao_servico: descricao, tecnico, status: 'Pendente' 
    }]);

    if (!error) {
        alert("🚀 OS Lançada!");
        location.reload();
    }
}

async function carregarTabelaMaster() {
    const { data } = await _supabase.from('ordens_servico').select('*').order('id', { ascending: false });
    const tabela = document.getElementById('lista-geral-os');
    tabela.innerHTML = '';
    
    data.forEach(os => {
        const cor = os.status === 'Concluido' ? '#dcfce7' : '#fff';
        tabela.innerHTML += `
            <tr style="background: ${cor}">
                <td>${os.cliente}</td>
                <td>${os.tecnico}</td>
                <td>${os.status}</td>
                <td>${os.valor_mao_de_obra ? 'R$ '+os.valor_mao_de_obra : '---'}</td>
                <td><button onclick="deletarOS(${os.id})">🗑️</button></td>
            </tr>`;
    });
}
window.onload = carregarTabelaMaster;
