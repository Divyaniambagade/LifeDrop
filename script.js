(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>'i'+Math.random().toString(36).slice(2,9);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- blood group data ---------- */
const GROUPS=['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const GIVE={
  'O-':['O-','O+','A-','A+','B-','B+','AB-','AB+'],
  'O+':['O+','A+','B+','AB+'],
  'A-':['A-','A+','AB-','AB+'],
  'A+':['A+','AB+'],
  'B-':['B-','B+','AB-','AB+'],
  'B+':['B+','AB+'],
  'AB-':['AB-','AB+'],
  'AB+':['AB+']
};
const RECEIVE={};
GROUPS.forEach(r=>{RECEIVE[r]=GROUPS.filter(g=>GIVE[g].includes(r));});
const GAP_DAYS=90;

/* ---------- date helpers ---------- */
const DAY=864e5;
const todayISO=()=>new Date().toLocaleDateString('en-CA');
const parseISO=s=>new Date(s+'T00:00:00');
const daysSince=s=>Math.floor((parseISO(todayISO())-parseISO(s))/DAY);
const addDays=(s,n)=>{const d=parseISO(s);d.setDate(d.getDate()+n);return d.toLocaleDateString('en-CA');};
const fmtDate=s=>parseISO(s).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
function ago(ts){
  const m=Math.round((Date.now()-ts)/6e4);
  if(m<1)return 'just now';
  if(m<60)return m+' min ago';
  const h=Math.round(m/60);
  if(h<24)return h+' hour'+(h>1?'s':'')+' ago';
  const d=Math.round(h/24);
  return d+' day'+(d>1?'s':'')+' ago';
}

/* ---------- storage (localStorage with in-memory fallback) ---------- */
const KEY='lifedrop.v1';
let mem=null;
function load(){
  try{const raw=localStorage.getItem(KEY);if(raw)return JSON.parse(raw);}catch(e){}
  return mem;
}
function save(){
  mem=state;
  try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
}

/* ---------- sample data (edit freely) ---------- */
function seed(){
  const t=todayISO(), back=n=>addDays(t,-n);
  const D=(name,age,gender,group,phone,city,area,last,available=true)=>({id:uid(),name,age,gender,group,phone,city,area,last,available,sample:true,mine:false});
  const R=(patient,group,units,hospital,city,phone,urgency,note,hoursAgo)=>({id:uid(),patient,group,units,hospital,city,phone,urgency,note,created:Date.now()-hoursAgo*36e5,fulfilled:false,sample:true,mine:false});
  return {
    donors:[
      D('Aarav Kulkarni',29,'Male','O+','90000 00101','Pune','Kothrud',back(160)),
      D('Neha Deshmukh',26,'Female','B+','90000 00102','Pune','Viman Nagar',back(45)),
      D('Rohan Patil',34,'Male','A+','90000 00103','Mumbai','Andheri West',back(200)),
      D('Priya Sharma',31,'Female','O-','90000 00104','Mumbai','Powai',back(140)),
      D('Kabir Singh',24,'Male','AB+','90000 00105','Delhi','Dwarka',''),
      D('Sneha Joshi',28,'Female','A-','90000 00106','Nagpur','Dharampeth',back(300)),
      D('Imran Sheikh',37,'Male','B-','90000 00107','Nashik','College Road',back(95)),
      D('Anjali Verma',30,'Female','O+','90000 00108','Nagpur','Sitabuldi',back(180)),
      D('Vikram Rao',41,'Male','B+','90000 00109','Bengaluru','Indiranagar',back(120)),
      D('Meera Nair',27,'Female','AB-','90000 00110','Bengaluru','Koramangala',''),
      D('Siddharth More',33,'Male','A+','90000 00111','Pune','Hadapsar',back(20)),
      D('Pooja Iyer',25,'Female','B+','90000 00112','Mumbai','Bandra',back(210),false)
    ],
    requests:[
      R('Mr. R. Gaikwad','B+',2,'City Care Hospital','Pune','90000 00201','critical','Surgery this evening',3),
      R('Baby of S. Khan','O-',1,'Sunrise Hospital','Mumbai','90000 00202','today','',7),
      R('Mrs. L. Thomas','A+',3,'Green Valley Hospital','Nagpur','90000 00203','week','Planned treatment',30)
    ],
    stock:{'O+':34,'O-':6,'A+':28,'A-':9,'B+':22,'B-':4,'AB+':12,'AB-':3}
  };
}
let state=load()||seed();
if(!state.donors||!state.requests||!state.stock)state=seed();
save();

/* ---------- logic ---------- */
const isReady=d=>d.available&&(!d.last||daysSince(d.last)>=GAP_DAYS);
const readyAgainOn=d=>d.last?addDays(d.last,GAP_DAYS):null;
function matchDonors(group,city){
  const c=(city||'').trim().toLowerCase();
  return state.donors.filter(d=>isReady(d)&&RECEIVE[group].includes(d.group)&&(!c||(d.city+' '+d.area).toLowerCase().includes(c)||c.includes(d.city.toLowerCase())));
}
const telHref=p=>p.replace(/[^\d+]/g,'');
const mapHref=(area,city)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(area+', '+city);
const PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>';

/* ---------- toast ---------- */
let toastTimer;
function toast(msg){
  const t=$('#toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),4800);
}
function go(id){document.getElementById(id).scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});}

/* ---------- theme + menu ---------- */
const root=document.documentElement;
function applyTheme(t){
  root.setAttribute('data-theme',t);
  $('#themeBtn').textContent=t==='dark'?'Light mode':'Dark mode';
  try{localStorage.setItem('lifedrop.theme',t);}catch(e){}
}
let savedTheme=null;try{savedTheme=localStorage.getItem('lifedrop.theme');}catch(e){}
applyTheme(savedTheme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
$('#themeBtn').addEventListener('click',()=>applyTheme(root.getAttribute('data-theme')==='dark'?'light':'dark'));
$('#menuBtn').addEventListener('click',e=>{
  const open=$('#nav').classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded',open);
});
$('#nav').addEventListener('click',e=>{if(e.target.closest('a')){$('#nav').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');}});

/* ---------- select options ---------- */
const opts=GROUPS.map(g=>`<option value="${g}">${g}</option>`).join('');
$('#fGroup').insertAdjacentHTML('beforeend',opts);
$('#rqGroup').innerHTML='<option value="">Choose</option>'+opts;
$('#dGroup').innerHTML='<option value="">Choose</option>'+opts;
$('#dLast').max=todayISO();

/* ---------- hero compatibility ---------- */
let heroGroup='O+';
function renderHero(pulse){
  $('#heroChips').innerHTML=GROUPS.map(g=>`<button type="button" class="chip" data-hero="${g}" aria-pressed="${g===heroGroup}">${g}</button>`).join('');
  $('#dropText').textContent=heroGroup;
  $('#dropSvg').setAttribute('aria-label','Blood group '+heroGroup);
  $('#giveList').innerHTML=GIVE[heroGroup].map(g=>`<span class="chip sm">${g}</span>`).join('');
  $('#recvList').innerHTML=RECEIVE[heroGroup].map(g=>`<span class="chip sm">${g}</span>`).join('');
  $('#compatNote').textContent=heroGroup==='O-'?'O negative is the universal donor: red cells can be given to any patient in an emergency.'
    :heroGroup==='AB+'?'AB positive is the universal recipient: you can receive red cells from any group.'
    :'Compatibility shown is for red blood cells.';
  $('#heroFind').textContent='Find '+heroGroup+' donors';
  if(pulse&&!reduce){const s=$('#dropSvg');s.classList.remove('pop');void s.getBoundingClientRect();s.classList.add('pop');}
}
$('#heroChips').addEventListener('click',e=>{
  const b=e.target.closest('[data-hero]');if(!b)return;
  heroGroup=b.dataset.hero;renderHero(true);
  $('#heroChips [aria-pressed="true"]').focus();
});
$('#heroFind').addEventListener('click',()=>showDonors({group:heroGroup,compat:true}));

/* ---------- stats + stock ---------- */
function level(u){
  if(u<8)return['Critical','crit'];
  if(u<15)return['Low','low'];
  if(u<25)return['Fair','fair'];
  return['Good','good'];
}
function renderStats(){
  const ready=state.donors.filter(isReady).length;
  const open=state.requests.filter(r=>!r.fulfilled).length;
  const units=GROUPS.reduce((n,g)=>n+(state.stock[g]||0),0);
  $('#sDonors').textContent=state.donors.length;
  $('#sReady').textContent=ready;
  $('#sOpen').textContent=open;
  $('#sUnits').textContent=units;
}
function renderStock(){
  $('#stockGrid').innerHTML=GROUPS.map(g=>{
    const u=state.stock[g]||0,[label,cls]=level(u);
    const ready=state.donors.filter(d=>d.group===g&&isReady(d)).length;
    return `<button type="button" class="stock" data-stock="${g}" aria-label="${g}: ${u} units in stock, ${label.toLowerCase()}, ${ready} donors ready. Show donors.">
      <span class="g">${g}</span>
      <span class="units"><b>${u}</b> units in stock</span>
      <span class="bar-track"><i class="${cls}" style="width:${Math.min(100,Math.round(u/40*100))}%"></i></span>
      <span class="lvl ${cls}">${label}</span>
      <span class="ready">${ready} donor${ready===1?'':'s'} ready</span>
    </button>`;
  }).join('');
}
$('#stockGrid').addEventListener('click',e=>{
  const b=e.target.closest('[data-stock]');if(!b)return;
  showDonors({group:b.dataset.stock,compat:false});
});

/* ---------- donors ---------- */
let newId=null;
function showDonors({group='',city='',compat=false,ready=true}){
  $('#fGroup').value=group;$('#fCity').value=city;
  $('#fCompat').checked=compat;$('#fReady').checked=ready;
  renderDonors();go('donors');
}
function filteredDonors(){
  const g=$('#fGroup').value,c=$('#fCity').value.trim().toLowerCase();
  const readyOnly=$('#fReady').checked,compat=$('#fCompat').checked;
  return state.donors.filter(d=>{
    if(g&&(compat?!RECEIVE[g].includes(d.group):d.group!==g))return false;
    if(c&&!(d.city+' '+d.area).toLowerCase().includes(c))return false;
    if(readyOnly&&!isReady(d))return false;
    return true;
  }).sort((a,b)=>(a.id===newId?-1:0)-(b.id===newId?-1:0)||(isReady(b)-isReady(a))||a.name.localeCompare(b.name));
}
function donorCard(d){
  const ready=isReady(d);
  let status;
  if(ready)status='<p class="status ready">Ready to donate</p>';
  else if(!d.available)status='<p class="status wait">Not available right now</p>';
  else status=`<p class="status wait">Can donate again on ${fmtDate(readyAgainOn(d))}</p>`;
  const mine=d.mine?`<button class="btn quiet sm" data-act="donated" data-id="${d.id}" type="button">I donated today</button>
    <button class="btn danger sm" data-act="rm-donor" data-id="${d.id}" type="button">Remove</button>`:'';
  return `<article class="donor${d.id===newId?' new':''}">
    <div class="badge-g" aria-label="Blood group ${d.group}">${d.group}</div>
    <div>
      <h3>${esc(d.name)}${d.sample?'<span class="tag">Sample</span>':''}</h3>
      <p class="meta">${esc(d.gender)}, ${esc(d.age)} years</p>
      <p class="meta">${PIN}<span>${esc(d.area)}, ${esc(d.city)}</span></p>
      ${status}
      <div class="actions">
        <a class="btn primary sm" href="tel:${telHref(d.phone)}">Call</a>
        <a class="btn ghost sm" href="sms:${telHref(d.phone)}">Message</a>
        <a class="btn ghost sm" href="${mapHref(d.area,d.city)}" target="_blank" rel="noopener">View location</a>
        ${mine}
      </div>
    </div>
  </article>`;
}
function renderDonors(){
  const list=filteredDonors();
  $('#donorCount').textContent=list.length?`Showing ${list.length} donor${list.length===1?'':'s'}`:'';
  $('#donorList').innerHTML=list.length?list.map(donorCard).join(''):
    `<div class="empty"><p><b>No donors match these filters.</b></p><p>Turn off “Ready to donate today”, include compatible groups, or post an urgent request.</p><a class="btn primary sm" href="#requests">Post a request</a></div>`;
}
['fGroup','fReady','fCompat'].forEach(id=>$('#'+id).addEventListener('change',renderDonors));
$('#fCity').addEventListener('input',renderDonors);

/* ---------- requests ---------- */
const URG={critical:['Needed immediately',0],today:['Needed today',1],week:['Needed this week',2]};
function reqCard(r){
  const matches=r.fulfilled?0:matchDonors(r.group,r.city).length;
  const tag=r.fulfilled?'<span class="urg done">Fulfilled</span>':`<span class="urg ${r.urgency}">${URG[r.urgency][0]}</span>`;
  const own=r.mine?`<button class="btn quiet sm" data-act="fulfill" data-id="${r.id}" type="button">${r.fulfilled?'Reopen':'Mark fulfilled'}</button>
    <button class="btn danger sm" data-act="rm-req" data-id="${r.id}" type="button">Remove</button>`:'';
  return `<article class="req${r.fulfilled?' done':''}">
    <div class="badge-g" aria-label="Blood group ${r.group}">${r.group}</div>
    <div>
      ${tag}
      <h3>${esc(r.patient)}${r.sample?'<span class="tag">Sample</span>':''}</h3>
      <p class="meta">${esc(r.units)} unit${r.units==1?'':'s'} needed at ${esc(r.hospital)}, ${esc(r.city)}</p>
      ${r.note?`<p class="meta">${esc(r.note)}</p>`:''}
      <p class="meta">Posted ${ago(r.created)}</p>
      ${r.fulfilled?'':`<p class="status ${matches?'ready':'wait'}">${matches?matches+' compatible donor'+(matches===1?'':'s')+' ready in this city':'No compatible donors listed in this city yet'}</p>`}
      <div class="actions">
        ${r.fulfilled?'':`<a class="btn primary sm" href="tel:${telHref(r.phone)}">Call requester</a>
        <button class="btn ghost sm" data-act="offer" data-id="${r.id}" type="button">I can donate</button>
        <button class="btn ghost sm" data-act="see" data-id="${r.id}" type="button">See donors</button>`}
        ${own}
      </div>
    </div>
  </article>`;
}
function renderRequests(){
  const list=[...state.requests].sort((a,b)=>(a.fulfilled-b.fulfilled)||(URG[a.urgency][1]-URG[b.urgency][1])||(b.created-a.created));
  $('#reqList').innerHTML=list.length?list.map(reqCard).join(''):'<div class="empty"><p>No open requests right now.</p></div>';
}

/* ---------- list actions (event delegation) ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const act=b.dataset.act,id=b.dataset.id;
  if(act==='rm-donor'||act==='rm-req'){
    if(b.dataset.armed!=='1'){
      b.dataset.armed='1';b.textContent='Tap again to confirm';
      setTimeout(()=>{if(b.isConnected){b.dataset.armed='';b.textContent='Remove';}},3000);return;
    }
    if(act==='rm-donor')state.donors=state.donors.filter(d=>d.id!==id);
    else state.requests=state.requests.filter(r=>r.id!==id);
    save();renderAll();toast('Removed.');return;
  }
  if(act==='donated'){
    const d=state.donors.find(x=>x.id===id);if(!d)return;
    d.last=todayISO();save();renderAll();
    toast(`Thank you! You can donate again on ${fmtDate(readyAgainOn(d))}.`);return;
  }
  if(act==='fulfill'){
    const r=state.requests.find(x=>x.id===id);if(!r)return;
    r.fulfilled=!r.fulfilled;save();renderAll();
    toast(r.fulfilled?'Request marked as fulfilled.':'Request reopened.');return;
  }
  if(act==='see'){
    const r=state.requests.find(x=>x.id===id);if(!r)return;
    showDonors({group:r.group,city:r.city,compat:true});return;
  }
  if(act==='offer'){
    const r=state.requests.find(x=>x.id===id);if(!r)return;
    $('#dGroup').value=GROUPS.includes(r.group)?r.group:'';
    $('#dCity').value=r.city;
    go('register');
    setTimeout(()=>$('#dName').focus({preventScroll:true}),reduce?0:500);
    toast('Add your details so the family can reach you.');
  }
});

/* ---------- forms ---------- */
function showErrors(form,errs){
  $$('[data-err]',form).forEach(p=>{
    const k=p.dataset.err;p.textContent=errs[k]||'';
    const f=form.elements[k];
    if(f&&f.setAttribute)f.setAttribute('aria-invalid',errs[k]?'true':'false');
  });
  const first=Object.keys(errs)[0];
  if(first&&form.elements[first])form.elements[first].focus();
}
const okPhone=p=>{const n=p.replace(/\D/g,'').length;return n>=7&&n<=15;};

$('#regForm').addEventListener('submit',e=>{
  e.preventDefault();
  const form=e.currentTarget,f=new FormData(form),errs={};
  const name=(f.get('name')||'').trim(),age=Number(f.get('age')),group=f.get('group'),phone=(f.get('phone')||'').trim();
  const city=(f.get('city')||'').trim(),area=(f.get('area')||'').trim(),last=f.get('last')||'';
  if(name.length<2)errs.name='Enter your full name.';
  if(!Number.isInteger(age)||age<18||age>65)errs.age='Donors must be between 18 and 65 years old.';
  if(!GROUPS.includes(group))errs.group='Choose your blood group.';
  if(!okPhone(phone))errs.phone='Enter a valid phone number (7 to 15 digits).';
  if(!city)errs.city='Enter your city.';
  if(!area)errs.area='Enter your area or a nearby landmark.';
  if(last&&parseISO(last)>parseISO(todayISO()))errs.last='The last donation date can’t be in the future.';
  if(!f.get('consent'))errs.consent='Tick the box to confirm you agree.';
  showErrors(form,errs);
  if(Object.keys(errs).length)return;
  const d={id:uid(),name,age,gender:f.get('gender'),group,phone,city,area,last,available:!!f.get('available'),sample:false,mine:true};
  state.donors.push(d);newId=d.id;save();
  form.reset();$('#dLast').max=todayISO();
  renderAll();
  showDonors({ready:isReady(d)});
  toast(isReady(d)?'You’re registered and now visible to people searching for blood.':`You’re registered. You’ll show as ready from ${fmtDate(readyAgainOn(d)||todayISO())}.`);
});

$('#reqForm').addEventListener('submit',e=>{
  e.preventDefault();
  const form=e.currentTarget,f=new FormData(form),errs={};
  const patient=(f.get('patient')||'').trim(),group=f.get('group'),units=Number(f.get('units'));
  const hospital=(f.get('hospital')||'').trim(),city=(f.get('city')||'').trim(),phone=(f.get('phone')||'').trim();
  if(patient.length<2)errs.patient='Enter the patient’s name.';
  if(!GROUPS.includes(group))errs.group='Choose a blood group.';
  if(!Number.isInteger(units)||units<1||units>20)errs.units='Enter 1 to 20 units.';
  if(!hospital)errs.hospital='Enter the hospital name.';
  if(!city)errs.city='Enter the city.';
  if(!okPhone(phone))errs.phone='Enter a valid contact number.';
  showErrors(form,errs);
  if(Object.keys(errs).length)return;
  state.requests.push({id:uid(),patient,group,units,hospital,city,phone,urgency:f.get('urgency'),note:(f.get('note')||'').trim(),created:Date.now(),fulfilled:false,sample:false,mine:true});
  save();form.reset();$('#rqUnits').value=1;$('#rqUrgency').value='today';
  renderAll();
  const n=matchDonors(group,city).length;
  toast(`Request posted. ${n} compatible donor${n===1?'':'s'} ready in ${city}.`);
});

$('#eligForm').addEventListener('submit',e=>{
  e.preventDefault();
  const age=Number($('#eAge').value),w=Number($('#eWeight').value),why=[];
  if(!(age>=18&&age<=65))why.push('donors are usually 18 to 65 years old');
  if(!(w>=45))why.push('the usual minimum weight is 45 kg');
  if(!$('#eWell').checked)why.push('you should feel well on the day');
  if(!$('#eGap').checked)why.push('wait at least 3 months between donations');
  if(!$('#eInk').checked)why.push('wait 6 months after a tattoo, piercing or surgery');
  const out=$('#eligResult');
  if(why.length){out.className='elig-result no';out.textContent='Not today: '+why.join('; ')+'.';}
  else{out.className='elig-result ok';out.textContent='You’re likely eligible to donate. Register above so people can find you.';}
});

$('#resetBtn').addEventListener('click',e=>{
  const b=e.currentTarget;
  if(b.dataset.armed!=='1'){b.dataset.armed='1';b.textContent='Tap again to erase all data';setTimeout(()=>{b.dataset.armed='';b.textContent='Reset sample data';},3000);return;}
  state=seed();newId=null;save();b.dataset.armed='';b.textContent='Reset sample data';
  renderAll();toast('Sample data restored.');
});

/* ---------- init ---------- */
function renderAll(){renderStats();renderStock();renderDonors();renderRequests();}
renderHero(false);
renderAll();
})();