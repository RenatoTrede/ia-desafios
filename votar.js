// ================== CONFIG ==================
const APPS_SCRIPT_BASE = 'https://script.google.com/macros/s/AKfycbzJYBg29MHEUXmlFl9ra1tXABuRwKpavid1AydCQ2A6M0s--XCwiZepaKLcU-JMVT2atg/exec';
const LIST_URL  = `${APPS_SCRIPT_BASE}?action=list&status=ativo`;
const VOTE_URL  = `${APPS_SCRIPT_BASE}?action=vote`;
// ===========================================

const listaEl = document.getElementById('lista');
const btn     = document.getElementById('btn-votar');
const fb      = document.getElementById('feedback');
const erroEl  = document.getElementById('erro');

function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, (c)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

async function carregar(){
  listaEl.textContent = 'Carregando propostas...';
  try{
    const res = await fetch(LIST_URL);
    const data = await res.json();
    if (!data?.ok) { listaEl.textContent = 'Falha ao carregar.'; return; }
    if (!Array.isArray(data.itens) || data.itens.length === 0){
      listaEl.textContent = 'Nenhuma proposta ativa no momento.';
      return;
    }

    listaEl.innerHTML = '';
    data.itens.forEach(item=>{
      const card = document.createElement('label');
      card.className = 'card';
      card.innerHTML = `
        <input type="checkbox" name="voto" value="${item.id}">
        <div>
          <h4>${escapeHtml(item.titulo)}</h4>
          <p>${escapeHtml(item.desc)}</p>
          ${item.grupo ? `<p class="meta">Grupo: ${escapeHtml(item.grupo)}</p>` : ''}
        </div>
      `;
      listaEl.appendChild(card);
    });
  }catch(e){
    listaEl.textContent = 'Erro de rede ao carregar.';
  }
}

btn.addEventListener('click', async ()=>{
  const marcados = [...document.querySelectorAll('input[name="voto"]:checked')].map(i=>i.value);
  if (marcados.length === 0) { fb.textContent = 'Selecione ao menos 1 proposta.'; return; }
  if (marcados.length > 3) { erroEl.classList.remove('hidden'); return; }
  erroEl.classList.add('hidden');

  fb.textContent = 'Enviando voto...';
  btn.disabled = true;
  try{
    const res = await fetch(VOTE_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tipo:'voto', escolhas: marcados })
    });
    const data = await res.json();
    if (data?.ok){
      fb.textContent = 'Voto registrado! Obrigado.';
      document.querySelectorAll('input[name="voto"]:checked').forEach(i=> i.checked=false);
    } else {
      fb.textContent = 'Não foi possível registrar. Tente novamente.';
    }
  }catch(e){
    fb.textContent = 'Erro de rede ao votar.';
  }finally{
    btn.disabled = false;
  }
});

// limite de 3
document.addEventListener('change', (e)=>{
  if (e.target.name === 'voto') {
    const marcados = document.querySelectorAll('input[name="voto"]:checked');
    if (marcados.length > 3) {
      e.target.checked = false;
      erroEl.classList.remove('hidden');
    }
  }
});

carregar();
