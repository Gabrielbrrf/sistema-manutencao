/* model_os.js - ATUALIZADO: FOCO NA TABELA COLABORADORES */
const SUPABASE_URL = 'https://olawjagrfhcxsonmyopi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXdqYWdyZmhjeHNvbm15b3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Mzc2NTEsImV4cCI6MjA4NjUxMzY1MX0.KB-n1QyDmDarzBofPuZ-SGUSUCwJsFq9p-HV3bWWMaY'; 

// MOTOR DO SISTEMA
if (!window._supabase) {
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const ManutencaoModel = {
    // BUSCA TÉCNICOS: Agora puxando especificamente da tabela colaboradores
    async buscarTecnicos() {
        try {
            console.log("Buscando time de manutenção na tabela colaboradores...");
            const { data, error } = await window._supabase
                .from('colaboradores') 
                .select('nome')
                // Garante que só apareçam os dois técnicos de campo
                .in('nome', ['Israel Sillas', 'Wil Sampaio']) 
                .order('nome');
            
            if (error || !data || data.length === 0) throw error;
            return data.map(t => t.nome);
            
        } catch (err) {
            console.warn("Erro ao acessar tabela colaboradores, usando lista manual:", err);
            // Backup de segurança para o sistema não parar
            return ["Israel Sillas", "Wil Sampaio"]; 
        }
    },

    async salvarNoBanco(dados) {
        return await window._supabase
            .from('ordens_servico')
            .insert([dados])
            .select();
    },

    async buscarTodasOS() {
        return await window._supabase
            .from('ordens_servico')
            .select('*')
            .order('hora_conclusao', { ascending: false });
    },

    async uploadNF(arquivo) {
        try {
            const nomeArquivo = `${Date.now()}_${arquivo.name}`;
            const { error } = await window._supabase.storage
                .from('notas_fiscais')
                .upload(nomeArquivo, arquivo);
            
            if (error) throw error;

            const { data } = window._supabase.storage
                .from('notas_fiscais')
                .getPublicUrl(nomeArquivo);
                
            return data.publicUrl;
        } catch (err) {
            console.error("Erro no upload da NF:", err);
            return "";
        }
    }
};
