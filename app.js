const fileInput   = document.getElementById('fileInput');
const dropZone    = document.getElementById('dropZone');
const imageGrid   = document.getElementById('imageGrid');
const imgCount    = document.getElementById('imgCount');
const gridSection = document.getElementById('image-grid-section');
const analyzeSection = document.getElementById('analyze-section');
const loadingSection = document.getElementById('loading-section');
const tierlistSection= document.getElementById('tierlist-section');
const actionBar   = document.getElementById('actionBar');


let uploadedImages = []; // { id, name, src }

  // ── Drag & drop ──
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles([...e.dataTransfer.files]);
  });
  fileInput.addEventListener('change', () => handleFiles([...fileInput.files]));

  function handleFiles(files) {
    const valid = files.filter(f => f.type.startsWith('image/'));
    const remaining = 20 - uploadedImages.length;
    valid.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => addImage({ id: Date.now() + Math.random(), name: file.name, src: e.target.result });
      reader.readAsDataURL(file);
    });
    fileInput.value = '';
  }

  function addImage(img) {
    uploadedImages.push(img);
    renderGrid();
    updateUI();
  }

  function removeImage(id) {
    uploadedImages = uploadedImages.filter(i => i.id !== id);
    renderGrid();
    updateUI();
  }

  function renderGrid() {
    imageGrid.innerHTML = uploadedImages.map(img => `
      <div class="img-card">
        <img src="${img.src}" alt="${img.name}">
        <button class="remove-btn" onclick="removeImage(${img.id})" title="Rimuovi">✕</button>
        <div class="img-name">${img.name}</div>
      </div>
    `).join('');
    imgCount.textContent = uploadedImages.length;
  }

  function updateUI() {
    const has = uploadedImages.length > 0;
    gridSection.style.display    = has ? 'block' : 'none';
    analyzeSection.style.display = has ? 'block' : 'none';
  }

  function clearAll() {
    uploadedImages = [];
    renderGrid();
    updateUI();
    tierlistSection.style.display = 'none';
    actionBar.style.display       = 'none';
  }

  // ── Analysis ──
  const loadingMessages = [
    ['Analisi in corso...', 'Esaminando le caratteristiche visive'],
    ['Confronto immagini...', 'Valutazione comparativa in corso'],
    ['Classificazione...', 'Assegnazione dei livelli tier'],
    ['Quasi pronto...', 'Finalizzazione della tier list'],
  ];

  function startAnalysis() {
    if (uploadedImages.length === 0) return;

    analyzeSection.style.display  = 'none';
    gridSection.style.display     = 'none';
    tierlistSection.style.display = 'none';
    loadingSection.style.display  = 'block';

    let step = 0;
    const interval = setInterval(() => {
      if (step < loadingMessages.length) {
        document.getElementById('loadingText').textContent = loadingMessages[step][0];
        document.getElementById('loadingSub').textContent  = loadingMessages[step][1];
        step++;
      }
    }, 900);

    
    (async () => {
        const result = { S: [], A: [], B: [], C: [], D: [], F: [] };

        for (let i = 0; i < uploadedImages.length; i++) {
            const img = uploadedImages[i];

            document.getElementById('loadingSub').textContent =
            `Analisi immagine ${i + 1}/${uploadedImages.length}`;

            try {
            const score = await analyzeImage(img.src);
            const tier = getTier(score);

            result[tier].push(img);
            } catch (e) {
            console.error("Errore:", e);
            result["C"].push(img);
            }
        }

        clearInterval(interval);
        loadingSection.style.display = 'none';

        showTierList(result);
    })();
  }

  // Mock analysis — distributes images into tiers
  function mockAnalysis() {
    const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];
    const shuffled = [...uploadedImages].sort(() => Math.random() - 0.5);
    const result = { S: [], A: [], B: [], C: [], D: [], F: [] };
    const weights = [0.1, 0.2, 0.3, 0.2, 0.15, 0.05];
    let pool = [...shuffled];

    tiers.forEach((t, i) => {
      const count = Math.round(pool.length * (weights[i] / weights.slice(i).reduce((a,b)=>a+b,0)));
      result[t] = pool.splice(0, Math.max(0, count));
    });

    // Remaining go to B
    result['B'].push(...pool);
    return result;
  }

  function showTierList(tierData) {
    const tiers = ['S','A','B','C','D','F'];
    const container = document.getElementById('tierListContainer');

    document.getElementById('tierlist-count').textContent = uploadedImages.length;

    container.innerHTML = tiers.map(tier => `
      <div class="tier-row" data-tier="${tier}">
        <div class="tier-label">${tier}</div>
        <div class="tier-items">
          ${tierData[tier].length === 0
            ? '<span class="tier-empty">Nessuna immagine</span>'
            : tierData[tier].map((img, i) => `
              <div class="tier-img-wrap" style="animation-delay:${i * 0.06}s">
                <img src="${img.src}" alt="${img.name}">
                <div class="tier-img-name">${img.name}</div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `).join('');

    tierlistSection.style.display = 'block';
    actionBar.style.display       = 'flex';
    tierlistSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetToUpload() {
    tierlistSection.style.display = 'none';
    actionBar.style.display       = 'none';
    clearAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Export as PNG (basic html2canvas-free approach)
  function exportTierList() {
    const el = document.getElementById('tierListContainer');
    // Notify user — full canvas export requires html2canvas in a real build
    const btn = event.currentTarget;
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiato!';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  }

  async function analyzeImage(imageSrc) {
  try {
    const blob = await (await fetch(imageSrc)).blob();

    //const res = await fetch("/.netlify/functions/analyze", {
    const res = await fetch("http://localhost:3000/api/hf-vision", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream"
      },
      body: blob
    });

    const data = await res.json();

    console.log("HF:", data);

    const score = data?.[0]?.score ? data[0].score * 100 : 50;

    return score;

  } catch (e) {
    console.error(e);
    return 50;
  }
}



function getTier(score) {
  if (score > 85) return "S";
  if (score > 70) return "A";
  if (score > 55) return "B";
  if (score > 40) return "C";
  if (score > 25) return "D";
  return "F";
}