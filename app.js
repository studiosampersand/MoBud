const STORE_KEY = 'vialego-v0.000.002';
const MODES = [
  ['motorcycle','🏍','Motorfiets'],['car','🚗','Auto'],['bicycle','🚲','Fiets'],['train','🚆','Trein'],['bus','🚌','Bus'],['tram','🚊','Tram/metro'],['walk','🚶','Te voet'],['home','🏠','Thuiswerk'],['other','📍','Ander']
];
const EXPENSE_CATEGORIES = ['Brandstof','Parking','Treinkaart','Buspas','Tram/metro','Boete','Onderhoud','Reparatie','Verzekering','Wegenbelasting','Motorkledij','Helm / gear','Fietsaccessoires','Openbaar vervoer abonnement','Andere onkost'];
const CURRENCY = {EUR:'€', GBP:'£', SEK:'SEK', NOK:'NOK'};
const todayISO = () => new Date().toISOString().slice(0,10);
const monthISO = () => new Date().toISOString().slice(0,7);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
let state = load();
function load(){
  const fallback = {settings:{userName:'',language:'nl',distanceUnit:'km',currency:'EUR',home1:'Thuis 1',home2:'',home3:'',workAddress:'Werk'},vehicles:[],trips:[],expenses:[]};
  try{return {...fallback,...JSON.parse(localStorage.getItem(STORE_KEY) || '{}')}}catch{return fallback}
}
function save(){localStorage.setItem(STORE_KEY, JSON.stringify(state)); render();}
function $(id){return document.getElementById(id)}
function fmtDate(d){return new Date(d+'T00:00:00').toLocaleDateString('nl-BE',{day:'2-digit',month:'short',year:'numeric'})}
function money(v){return `${CURRENCY[state.settings.currency]||''}${Number(v||0).toFixed(2)}`}
function dist(v){return `${Number(v||0).toFixed(1)} ${state.settings.distanceUnit||'km'}`}
function currentMonthTrips(){const m=monthISO(); return state.trips.filter(t=>t.date?.startsWith(m));}
function currentMonthExpenses(){const m=monthISO(); return state.expenses.filter(e=>e.date?.startsWith(m));}
function setupPresets(){
  const s=state.settings; return [['home1',s.home1||'Thuis 1'],['home2',s.home2||'Thuis 2'],['home3',s.home3||'Thuis 3'],['work',s.workAddress||'Werk'],['other','Ander']].filter(x=>x[1]);
}
function modeLabel(key){return (MODES.find(m=>m[0]===key)||['','📍',key])[2]}
function modeIcon(key){return (MODES.find(m=>m[0]===key)||['','📍',key])[1]}
function bootstrap(){
  if(!state.vehicles.length){
    state.vehicles = [
      {id:uid(),name:'Privé motorfiets',mode:'motorcycle',use:'Woon-werk',from:'Thuis 1',to:'Werk',distance:25},
      {id:uid(),name:'Privé auto',mode:'car',use:'Gemengd',from:'Thuis 1',to:'Werk',distance:25},
      {id:uid(),name:'Privé fiets',mode:'bicycle',use:'Woon-werk',from:'Thuis 1',to:'Werk',distance:14},
      {id:uid(),name:'Trein / bus',mode:'train',use:'Woon-werk',from:'Thuis 1',to:'Werk',distance:25}
    ];
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }
}
function init(){
  bootstrap();
  $('todayLabel').textContent = new Date().toLocaleDateString('nl-BE',{weekday:'long',day:'numeric',month:'long'});
  MODES.forEach(([id,emoji,label])=>{ $('vehicleMode').append(new Option(`${emoji} ${label}`,id)); $('tripMode').append(new Option(`${emoji} ${label}`,id)); });
  EXPENSE_CATEGORIES.forEach(c=>$('expenseCategory').append(new Option(c,c)));
  bind(); render();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
function bind(){
  $('setupBtn').onclick=()=> $('setupPanel').classList.toggle('hidden');
  $('settingsForm').onsubmit=e=>{e.preventDefault(); ['userName','language','distanceUnit','currency','home1','home2','home3','workAddress'].forEach(k=>state.settings[k]=$(k).value); save(); $('setupPanel').classList.add('hidden');};
  $('addVehicleBtn').onclick=()=>openVehicle();
  $('vehicleForm').onsubmit=e=>{e.preventDefault(); addVehicle();};
  $('addTripBtn').onclick=()=>openTrip();
  $('tripForm').onsubmit=e=>{e.preventDefault(); addTrip();};
  $('addExpenseBtn').onclick=()=>openExpense();
  $('expenseForm').onsubmit=e=>{e.preventDefault(); addExpense();};
  $('swapRouteBtn').onclick=()=>{let a=$('tripFrom').value,b=$('tripTo').value;$('tripFrom').value=b;$('tripTo').value=a;};
  $('tripFromPreset').onchange=()=>applyPreset('tripFromPreset','tripFrom');
  $('tripToPreset').onchange=()=>applyPreset('tripToPreset','tripTo');
  $('reportBtn').onclick=()=>openReport();
  $('printReportBtn').onclick=()=>window.print();
  $('mailReportBtn').onclick=()=>mailReport();
  $('closeReportBtn').onclick=()=>$('reportDialog').close();
  $('reportMonth').onchange=()=>buildReport($('reportMonth').value);
  $('backupBtn').onclick=()=>download('vialego-backup.json', JSON.stringify(state,null,2), 'application/json');
  $('clearSampleBtn').onclick=()=>{ if(confirm('Alle ritten en kosten wissen?') && confirm('Zeker? Dit kan niet ongedaan gemaakt worden.')){state.trips=[];state.expenses=[];save();}}
}
function hydrateSettings(){Object.keys(state.settings).forEach(k=>{if($(k)) $(k).value=state.settings[k]||'';});}
function fillVehicleSelects(){
  ['tripVehicle','expenseVehicle'].forEach(id=>{const el=$(id); el.innerHTML=''; state.vehicles.forEach(v=>el.append(new Option(`${modeIcon(v.mode)} ${v.name}`,v.id)));});
}
function fillPresets(){
  ['tripFromPreset','tripToPreset'].forEach(id=>{const el=$(id); el.innerHTML=''; el.append(new Option('Kies...', '')); setupPresets().forEach(([k,v])=>el.append(new Option(v,k)));});
}
function applyPreset(selectId,inputId){
  const val=$(selectId).value; if(!val) return; const found=setupPresets().find(p=>p[0]===val); if(found[0]==='other'){$(inputId).value='';$(inputId).focus();} else $(inputId).value=found[1];
}
function render(){
  hydrateSettings(); fillVehicleSelects(); fillPresets(); renderModes(); renderVehicles(); renderTrips(); renderExpenses(); renderStats(); renderMix(); renderSmartStats();
}
function renderModes(){
  $('modeGrid').innerHTML = MODES.map(([id,emoji,label])=>`<button class="mode-btn" data-mode="${id}"><strong>${emoji} ${label}</strong><span class="meta">Snel rit toevoegen</span></button>`).join('');
  document.querySelectorAll('.mode-btn').forEach(btn=>btn.onclick=()=>openTrip(btn.dataset.mode));
}
function renderVehicles(){
  $('vehiclesList').innerHTML = state.vehicles.length ? state.vehicles.map(v=>`<div class="card"><strong>${modeIcon(v.mode)} ${v.name}</strong><p class="meta">${modeLabel(v.mode)} · ${v.use} · ${v.from||'—'} → ${v.to||'—'} · ${dist(v.distance)}</p><button class="small danger" onclick="deleteVehicle('${v.id}')">Verwijder</button></div>`).join('') : '<div class="empty">Voeg je eerste voertuig/profiel toe.</div>';
}
window.deleteVehicle=(id)=>{ if(confirm('Voertuig verwijderen? Ritten blijven bestaan.')){state.vehicles=state.vehicles.filter(v=>v.id!==id);save();}}
function renderTrips(){
  const rows=[...state.trips].sort((a,b)=>b.date.localeCompare(a.date));
  $('tripList').innerHTML = rows.length ? rows.map(t=>`<div class="row"><div><strong>${modeIcon(t.mode)} ${t.vehicleName||modeLabel(t.mode)}</strong><p class="meta">${fmtDate(t.date)} · ${t.from} → ${t.to} · ${dist(t.distance)} · ${t.use}</p>${t.note?`<span class="tag">${t.note}</span>`:''}</div><div class="row-actions"><button class="small danger" onclick="deleteTrip('${t.id}')">Verwijder</button></div></div>`).join('') : '<div class="empty">Nog geen ritten. Gebruik een snelle knop hierboven.</div>';
}
window.deleteTrip=(id)=>{ if(confirm('Rit verwijderen?') && confirm('Dubbele check: deze rit echt permanent verwijderen?')){state.trips=state.trips.filter(t=>t.id!==id);save();}}
function renderExpenses(){
  const rows=[...state.expenses].sort((a,b)=>b.date.localeCompare(a.date));
  $('expenseList').innerHTML = rows.length ? rows.map(e=>`<div class="row"><div><strong>${e.category} · ${money(e.amount)}</strong><p class="meta">${fmtDate(e.date)} · ${e.vehicleName||'Algemeen'} · ${e.use}</p>${e.note?`<span class="tag">${e.note}</span>`:''}</div>${e.receipt?`<img class="receipt" src="${e.receipt}" alt="bonnetje">`:''}<div class="row-actions"><button class="small danger" onclick="deleteExpense('${e.id}')">Verwijder</button></div></div>`).join('') : '<div class="empty">Nog geen kosten of bonnetjes opgeladen.</div>';
}
window.deleteExpense=(id)=>{ if(confirm('Kost/bonnetje verwijderen?') && confirm('Dubbele check: dit bonnetje echt permanent verwijderen?')){state.expenses=state.expenses.filter(e=>e.id!==id);save();}}
function renderStats(){
  const trips=currentMonthTrips(), ex=currentMonthExpenses();
  const km=trips.reduce((s,t)=>s+Number(t.distance||0),0); const cost=ex.reduce((s,e)=>s+Number(e.amount||0),0);
  const home=trips.filter(t=>t.mode==='home').length;
  $('monthKm').textContent=dist(km);
  const days=new Set([...state.trips.map(t=>t.date),...state.expenses.map(e=>e.date)]).size;
  $('streakText').textContent=`${days} dagen gelogd`;
  $('encourageText').textContent=days?`Goed bezig. Je dossier groeit elke dag.`:'Log vandaag om je transportdossier te starten.';
  $('statsGrid').innerHTML = [
    ['Transport deze maand',dist(km)],['Kosten deze maand',money(cost)],['Ritten',trips.length],['Thuiswerkdagen',home],['Bonnetjes',state.expenses.filter(e=>e.receipt).length],['Voertuigen',state.vehicles.length]
  ].map(s=>`<div class="stat"><span class="meta">${s[0]}</span><strong>${s[1]}</strong></div>`).join('');
}
function renderMix(){
  const trips=currentMonthTrips(); const total=trips.reduce((s,t)=>s+Number(t.distance||0),0) || 1;
  const by={}; trips.forEach(t=>by[t.mode]=(by[t.mode]||0)+Number(t.distance||0));
  $('vehicleMix').innerHTML = Object.keys(by).length ? Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([mode,km])=>{const pct=Math.round(km/total*100);return `<div class="bar-row"><span>${modeIcon(mode)} ${modeLabel(mode)}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><strong>${pct}%</strong></div>`}).join('') : '<div class="empty">Nog geen data voor deze maand.</div>';
}
function renderSmartStats(){
  const trips=state.trips; const kmByVehicle={}; trips.forEach(t=>kmByVehicle[t.vehicleName||modeLabel(t.mode)]=(kmByVehicle[t.vehicleName||modeLabel(t.mode)]||0)+Number(t.distance||0));
  const bikeKm=trips.filter(t=>t.mode==='bicycle').reduce((s,t)=>s+Number(t.distance||0),0);
  const ptKm=trips.filter(t=>['train','bus','tram'].includes(t.mode)).reduce((s,t)=>s+Number(t.distance||0),0);
  const savedFuel=(bikeKm+ptKm)/16; const co2=(bikeKm+ptKm)*0.17; const kcal=bikeKm*32;
  const cards=[`<div class="card"><strong>Bonnetjes opgeladen</strong><p class="meta">${state.expenses.filter(e=>e.receipt).length} bonnetjes bewaard in je lokale dossier.</p></div>`,
    `<div class="card"><strong>Besparing indicatie</strong><p class="meta">Door fiets/openbaar vervoer: ±${savedFuel.toFixed(1)} liter brandstof, ±${co2.toFixed(1)} kg CO₂ en ±${Math.round(kcal)} kcal.</p></div>`];
  Object.entries(kmByVehicle).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([name,km])=>cards.push(`<div class="card"><strong>${name}</strong><p class="meta">${dist(km)} totaal geregistreerd.</p></div>`));
  $('smartStats').innerHTML=cards.join('');
}
function openVehicle(){ $('vehicleForm').reset(); $('vehicleDialog').showModal(); }
function addVehicle(){state.vehicles.push({id:uid(),name:$('vehicleName').value,mode:$('vehicleMode').value,use:$('vehicleUse').value,from:$('vehicleFrom').value,to:$('vehicleTo').value,distance:Number($('vehicleDistance').value||0)}); $('vehicleDialog').close(); save();}
function openTrip(mode){
  $('tripForm').reset(); $('tripDate').value=todayISO(); fillVehicleSelects(); fillPresets();
  if(mode){$('tripMode').value=mode; const v=state.vehicles.find(v=>v.mode===mode); if(v){$('tripVehicle').value=v.id; applyVehicleToTrip(v);}}
  else if(state.vehicles[0]){ $('tripVehicle').value=state.vehicles[0].id; applyVehicleToTrip(state.vehicles[0]); }
  $('tripVehicle').onchange=()=>{const v=state.vehicles.find(v=>v.id===$('tripVehicle').value); if(v) applyVehicleToTrip(v)};
  $('tripDialog').showModal();
}
function applyVehicleToTrip(v){$('tripMode').value=v.mode;$('tripUse').value=v.use;$('tripFrom').value=v.from;$('tripTo').value=v.to;$('tripDistance').value=v.distance;}
function addTrip(){const v=state.vehicles.find(v=>v.id===$('tripVehicle').value); state.trips.push({id:uid(),date:$('tripDate').value,vehicleId:v?.id,vehicleName:v?.name,mode:$('tripMode').value,use:$('tripUse').value,from:$('tripFrom').value,to:$('tripTo').value,distance:Number($('tripDistance').value||0),note:$('tripNote').value}); $('tripDialog').close(); save();}
function openExpense(){ $('expenseForm').reset(); $('expenseDate').value=todayISO(); fillVehicleSelects(); $('expenseDialog').showModal(); }
function addExpense(){
  const file=$('expenseReceipt').files[0]; const done=(receipt)=>{const v=state.vehicles.find(v=>v.id===$('expenseVehicle').value); state.expenses.push({id:uid(),date:$('expenseDate').value,vehicleId:v?.id,vehicleName:v?.name,category:$('expenseCategory').value,use:$('expenseUse').value,amount:Number($('expenseAmount').value||0),receipt,note:$('expenseNote').value}); $('expenseDialog').close(); save();};
  if(file) compressImage(file,done); else done('');
}
function compressImage(file,cb){const r=new FileReader(); r.onload=()=>{const img=new Image(); img.onload=()=>{const c=document.createElement('canvas'); const max=900; const scale=Math.min(1,max/Math.max(img.width,img.height)); c.width=img.width*scale; c.height=img.height*scale; c.getContext('2d').drawImage(img,0,0,c.width,c.height); cb(c.toDataURL('image/jpeg',.72));}; img.src=r.result;}; r.readAsDataURL(file);}
function openReport(){ $('reportMonth').value=monthISO(); buildReport(monthISO()); $('reportDialog').showModal(); }
function buildReport(m){
  const trips=state.trips.filter(t=>t.date?.startsWith(m)); const ex=state.expenses.filter(e=>e.date?.startsWith(m));
  const km=trips.reduce((s,t)=>s+Number(t.distance||0),0); const cost=ex.reduce((s,e)=>s+Number(e.amount||0),0);
  $('reportPreview').innerHTML=`<h1>Vialego maandrapport</h1><p>${state.settings.userName||'Gebruiker'} · ${m}</p><h2>Samenvatting</h2><table><tr><th>Ritten</th><td>${trips.length}</td></tr><tr><th>Kilometers</th><td>${dist(km)}</td></tr><tr><th>Kosten</th><td>${money(cost)}</td></tr><tr><th>Bonnetjes</th><td>${ex.filter(e=>e.receipt).length}</td></tr></table><h2>Ritten</h2><table><tr><th>Datum</th><th>Voertuig</th><th>Route</th><th>Km</th><th>Gebruik</th></tr>${trips.map(t=>`<tr><td>${fmtDate(t.date)}</td><td>${t.vehicleName||modeLabel(t.mode)}</td><td>${t.from} → ${t.to}</td><td>${dist(t.distance)}</td><td>${t.use}</td></tr>`).join('')}</table><h2>Kosten en bonnetjes</h2><table><tr><th>Datum</th><th>Categorie</th><th>Voertuig</th><th>Bedrag</th><th>Bon</th></tr>${ex.map(e=>`<tr><td>${fmtDate(e.date)}</td><td>${e.category}</td><td>${e.vehicleName||''}</td><td>${money(e.amount)}</td><td>${e.receipt?`<img src="${e.receipt}" />`:'—'}</td></tr>`).join('')}</table><p>Dit rapport werd lokaal gegenereerd op het toestel. Er werd niets geüpload.</p>`;
}
function mailReport(){const m=$('reportMonth').value||monthISO(); const trips=state.trips.filter(t=>t.date?.startsWith(m)); const ex=state.expenses.filter(e=>e.date?.startsWith(m)); const km=trips.reduce((s,t)=>s+Number(t.distance||0),0); const cost=ex.reduce((s,e)=>s+Number(e.amount||0),0); const body=`Vialego rapport ${m}%0D%0A%0D%0ARitten: ${trips.length}%0D%0AKilometers: ${dist(km)}%0D%0AKosten: ${money(cost)}%0D%0ABonnetjes: ${ex.filter(e=>e.receipt).length}%0D%0A%0D%0ATip: gebruik Print / lokaal PDF opslaan om bonnetjes mee te nemen.`; location.href=`mailto:?subject=${encodeURIComponent('Vialego rapport '+m)}&body=${body}`;}
function download(name,content,type){const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
init();
