/* model_os.js */
const SUPABASE_URL = 'https://olawjagrfhcxsonmyopi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXdqYWdyZmhjeHNvbm15b3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Mzc2NTEsImV4cCI6MjA4NjUxMzY1MX0.KB-n1QyDmDarzBofPuZ-SGUSUCwJsFq9p-HV3bWWMaY'; 

// ISSO AQUI É O MOTOR DO SISTEMA
window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ManutencaoModel = {
    async buscarTecnicos() {
        try {
            const { data, error } = await window._supabase.from('contatos').select('nome').order('nome');
            if (error) throw error;
            return data.map(t => t.nome);
        } catch (err) {
            console.error("Erro no Model:", err);
            return ["Claudio", "Roberto", "Ricardo"]; 
        }
    },
    async salvarNoBanco(dados) {
        return await window._supabase.from('ordens_servico').insert([dados]).select();
    },
    async buscarTodasOS() {
        return await window._supabase.from('ordens_servico').select('*').order('hora_conclusao', { ascending: false });
    },
    async uploadNF(arquivo) {
        const nomeArquivo = `${Date.now()}_${arquivo.name}`;
        const { error } = await window._supabase.storage.from('notas_fiscais').upload(nomeArquivo, arquivo);
        if (error) return "";
        const { data } = window._supabase.storage.from('notas_fiscais').getPublicUrl(nomeArquivo);
        return data.publicUrl;
    }
};