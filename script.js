// ================= CONFIG: troque pela SUA URL base do Apps Script =================
const APPS_SCRIPT_BASE = 'https://script.google.com/macros/s/SEU_ID/exec';
const GET_DESAFIOS_URL   = `${APPS_SCRIPT_BASE}?action=list`;
const SUBMIT_DESAFIO_URL = `${APPS_SCRIPT_BASE}?action=submit`;
const SUBMIT_VOTO_URL    = `${APPS_SCRIPT_BASE}?action=vote`;
// =============================================================================

// --------- Navegação entre slides + barra de progresso ---------
const slides = [...document.querySelectorAll('.question-slide')];
let current = 0;

function showSlide(i){
  slides[current].classList.remove('active-slide');
  current = Math.max(0, Math.min(i, slides.length-1));
  slides[current].classList.add('active-slide');
  updateProgress();
  if (slides[current].id === 'slide-3') carregarDesafiosParaVoto();
}
function next(){
  if (slides[current].id === 'slide-1'){
    const nome = getNomeDiscente();
    if (!nome){ alert('Preencha seu nome para continuar.'); return; }
  }
  showSlide(current+1);
}
function back(){ showSlide(current-1); }
function updateProgress(){
  const bar = document.getElementById('progress-bar');
  const pct = ((current+1)/slides.length)*100;
  bar.style.width = `${pct}%`;
}
document.getElementById('next-btn').addEventListener('click', next);
document.getElementById('back-btn').addEventListener('click', back);

// util
function getNomeDiscente(){
  const el = document.getElementById('nome_discente');
  return el ? (el.value || '').trim() : '';
}

// --------- Desafio: enviar ---------
async function enviarDesafio(){
  const nome = getNomeDiscente();
  const titulo = document.getElementById('desafio_titulo').value.trim();
  const area = document.getElementById('desafio_area').value;
  const desc = document.getElementById('desafio_desc').value.trim();
  const produto = document.getElementById('desafio_produto').value;
  const ferramentas = document.getElementById('desafio_ferramentas').value.trim();
  const fb = document.getElementById('desafio-feedback');

  if (!nome){ fb.textContent = 'Preencha seu nome no passo anterior.'; return; }
  if (!titulo || !area || !produto){ fb.textContent = 'Preencha os campos obrigatórios.'; return; }
  if (desc.length > 300){ fb.textContent = 'A descrição deve ter até 300 caracteres.'; return; }

  fb.textContent = 'Enviando...';
  try{
    const res = await fetch(SUBMIT_DESAFIO_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tipo:'desafio', nome, titulo, area, desc, produto, ferramentas })
    });
    const data = await res.json();
    if (data?.ok){
      fb.textContent = 'Desafio enviado! Vá para a votação.';
      setTimeout(()=>showSlide(current+1), 900);
    } else {
      fb.textContent = 'Falha ao enviar. Tente novamente.';
    }
  }catch(err){
    fb.textContent = 'Erro de rede ao enviar.';
  }
}
document.getElementById('btn-enviar-desafio').addEventListener('click', enviarDesafio);

// --------- Votação: listar + enviar ---------
async function carregarDesafiosParaVoto(){
  const cont = document.getElementById('lista-desafios');
  cont.innerHTML = 'Carregando desafios...';
  try{
    const res = await fetch(GET_DESAFIOS_URL);
    const data = await res.json(); // { ok:true, itens:[{id,titulo,area,desc,produto,autor}] }
    if (!data?.ok){ cont.textContent = 'Falha ao carregar desafios.'; return; }

    if (!Array.isArray(data.itens) || data.itens.length===0){
      cont.textContent = 'Ainda não há desafios cadastrados. Envie o seu no passo anterior.';
      return;
    }

    cont.innerHTML = '';
    data.itens.forEach(item=>{
      const card = document.createElement('label');
      card.className = 'card';
      card.innerHTML = `
        <input type="checkbox" name="voto_desafio" value="${item.id}">
        <div>
          <h4>${escapeHtml(item.titulo || '')}</h4>
          <p>${escapeHtml(item.desc || '')}</p>
          <p class="meta">Área: ${escapeHtml(item.area || '')} · Produto: ${escapeHtml(item.produto || '')}</p>
        </div>
      `;
      cont.appendChild(card);
    });
  }catch(err){
    cont.textContent = 'Erro de rede ao carregar a lista.';
  }
}

async function enviarVoto(){
  const nome = getNomeDiscente();
  const fb = document.getElementById('voto-feedback');
  const erro = document.getElementById('voto-erro');
  const escolhas = [...document.querySelectorAll('input[name="voto_desafio"]:checked')].map(i=>i.value);

  if (!nome){ fb.textContent='Preencha seu nome no passo 1.'; return; }
  if (escolhas.length===0){ fb.textContent='Selecione ao menos 1 desafio.'; return; }
  if (escolhas.length>3){ erro.classList.remove('hidden'); return; }
  erro.classList.add('hidden');

  fb.textContent = 'Registrando seu voto...';
  try{
    const res = await fetch(SUBMIT_VOTO_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tipo:'voto', nome, escolhas })
    });
    const data = await res.json();
    if (data?.ok){
      fb.textContent = 'Voto registrado!';
      setTimeout(()=> showSlide(current+1), 900);
    }else{
      fb.textContent = 'Não foi possível registrar. Tente novamente.';
    }
  }catch(err){
    fb.textContent = 'Erro de rede ao votar.';
  }
}
document.getElementById('btn-enviar-voto').addEventListener('click', enviarVoto);

// limita a 3 checkboxes
document.addEventListener('change', (e)=>{
  if (e.target.name === 'voto_desafio'){
    const marcados = document.querySelectorAll('input[name="voto_desafio"]:checked');
    if (marcados.length>3){
      e.target.checked = false;
      document.getElementById('voto-erro').classList.remove('hidden');
    }
  }
});

// Helper para evitar injeção em HTML
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
