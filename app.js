const $ = (s) => document.querySelector(s);
const modal = $("#activityModal");
const modalTitle = $("#modalTitle");
const modalEyebrow = $("#modalEyebrow");
const modalBody = $("#modalBody");
const nextStep = $("#nextStep");
const STORE_KEY = "mindcareAssessHistory";
let activity = null, stage = 0, score = 0, answers = [], wordSet = [], timer = null;

$("#menuToggle").addEventListener("click", () => {
  const nav = $("#nav"); const opened = nav.classList.toggle("open");
  $("#menuToggle").setAttribute("aria-expanded", String(opened));
});
$("#nav").querySelectorAll("a").forEach(a => a.addEventListener("click", () => $("#nav").classList.remove("open")));
document.querySelectorAll("[data-start]").forEach(btn => btn.addEventListener("click", () => begin(btn.dataset.start)));
$("#closeModal").addEventListener("click", closeModal);
$("#cancelActivity").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if(e.target === modal) closeModal(); });
$("#downloadReport").addEventListener("click", downloadReport);
$("#clearHistory").addEventListener("click", () => {
  if(confirm("Clear all activity history stored in this browser?")) { localStorage.removeItem(STORE_KEY); renderHistory(); }
});

function begin(type) {
  clearTimeout(timer); activity = type; stage = 0; score = 0; answers = [];
  modal.hidden = false;
  if(type === "memory") {
    modalEyebrow.textContent = "MEMORY · WORD RECALL"; modalTitle.textContent = "Give your memory a moment";
    modalBody.innerHTML = `<p>You will see six everyday words. Study them for a short time, then type as many as you remember. Spelling does not need to be perfect.</p><div class="result-box"><strong>Tip</strong><p>Try grouping the words into a little story.</p></div>`;
    nextStep.innerHTML = 'Show words <span>→</span>';
  } else if(type === "focus") {
    modalEyebrow.textContent = "ATTENTION · FOCUS FINDER"; modalTitle.textContent = "Find the different symbol";
    modalBody.innerHTML = `<p>Choose the symbol that is different from the others. This is a simple attention activity, not a clinical test.</p><div class="result-box"><strong>Take your time</strong><p>There are five rounds. Each correct answer earns one point.</p></div>`;
    nextStep.innerHTML = 'Start round 1 <span>→</span>';
  } else {
    modalEyebrow.textContent = "REASONING · PATTERN PUZZLE"; modalTitle.textContent = "Spot the pattern";
    modalBody.innerHTML = `<p>Choose the number that logically comes next in each sequence. There are five questions.</p><div class="result-box"><strong>Think it through</strong><p>Look for a rule such as adding, subtracting or multiplying.</p></div>`;
    nextStep.innerHTML = 'Start puzzle <span>→</span>';
  }
  nextStep.onclick = advance;
}
function closeModal(){ clearTimeout(timer); modal.hidden=true; activity=null; }
function advance(){
  if(activity==="memory") memoryAdvance();
  if(activity==="focus") focusAdvance();
  if(activity==="pattern") patternAdvance();
}
function memoryAdvance(){
  if(stage===0){
    wordSet = shuffle(["river","candle","apple","garden","button","cloud"]);
    modalTitle.textContent="Remember these words"; modalBody.innerHTML=`<p>Study these six words. They will disappear shortly.</p><div class="word-chips">${wordSet.map(w=>`<span class="word-chip">${w}</span>`).join("")}</div><p id="countdown" class="small-note">Words disappear in 10 seconds.</p>`;
    nextStep.disabled=true; nextStep.textContent="Please wait…"; let n=10; $("#countdown").textContent=`Words disappear in ${n} seconds.`;
    timer=setInterval(()=>{n--; if($("#countdown")) $("#countdown").textContent=n>0?`Words disappear in ${n} seconds.`:"Ready?"; if(n<=0){clearInterval(timer);stage=1;showMemoryRecall();}},1000);
  } else if(stage===1){
    const typed=$("#recallInput").value.toLowerCase().split(/[,;\s]+/).map(w=>w.trim()).filter(Boolean);
    const correct=[...new Set(typed.filter(w=>wordSet.includes(w)))]; score=correct.length;
    finishActivity("Word recall",score,6,`You recalled ${score} of the 6 words shown.`,correct.join(", ")||"No matching words");
  }
}
function showMemoryRecall(){
  modalTitle.textContent="Which words do you remember?";modalBody.innerHTML=`<p>Enter the words you remember, separated by spaces or commas.</p><label class="input-label" for="recallInput">Your remembered words</label><input class="text-input" id="recallInput" autocomplete="off" placeholder="e.g. river, apple, ..."><p class="small-note">This activity is for practice only. The score has no diagnostic meaning.</p>`;
  nextStep.disabled=false;nextStep.innerHTML="Check answers →";nextStep.onclick=memoryAdvance;$("#recallInput").focus();
}
const focusRounds=[
 {target:"◆",options:["◆","◇","◆","◆"],answer:1},
 {target:"○",options:["○","○","◯","○"],answer:2},
 {target:"△",options:["△","▽","△","△"],answer:1},
 {target:"★",options:["★","★","☆","★"],answer:2},
 {target:"□",options:["□","□","▢","□"],answer:2}
];
function focusAdvance(){
 if(stage>=5){finishActivity("Focus finder",score,5,`You selected the different symbol correctly in ${score} of 5 rounds.`);return;}
 const i=stage; const round=focusRounds[i]; modalTitle.textContent=`Round ${i+1} of 5`;modalBody.innerHTML=`<p>Tap the symbol that looks different from the others.</p><div class="word-chips" style="justify-content:center"><span class="word-chip" style="font-size:28px">${round.target}</span><span class="word-chip">Target</span></div><div class="answer-grid">${round.options.map((o,j)=>`<button class="answer-option" data-choice="${j}" aria-label="Option ${j+1}">${o}</button>`).join("")}</div><p class="small-note">Choose one option to continue.</p>`;
 document.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{if(b.disabled)return;document.querySelectorAll("[data-choice]").forEach(x=>x.disabled=true);if(+b.dataset.choice===round.answer)score++;stage++;nextStep.disabled=false;nextStep.innerHTML=stage>=5?"See result →":"Next round →";}));
 nextStep.disabled=true;nextStep.textContent="Choose a symbol";nextStep.onclick=()=>{if(stage===i)return;focusAdvance();};
}
const puzzles=[
 {q:"2, 4, 6, 8, …",opts:["9","10","12","14"],a:1},
 {q:"5, 10, 15, 20, …",opts:["22","24","25","30"],a:2},
 {q:"1, 2, 4, 8, …",opts:["10","12","14","16"],a:3},
 {q:"10, 9, 7, 4, …",opts:["3","2","1","0"],a:2},
 {q:"3, 6, 9, 12, …",opts:["13","14","15","18"],a:2}
];
function patternAdvance(){
 if(stage>=5){finishActivity("Pattern puzzle",score,5,`You answered ${score} of 5 sequences correctly.`);return;}
 const i=stage,p=puzzles[i];modalTitle.textContent=`Puzzle ${i+1} of 5`;modalBody.innerHTML=`<p>What number comes next in this sequence?</p><div class="result-box"><strong style="font-size:24px">${p.q}</strong></div><div class="answer-grid">${p.opts.map((o,j)=>`<button class="answer-option" data-choice="${j}">${o}</button>`).join("")}</div>`;
 document.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{if(b.disabled)return;document.querySelectorAll("[data-choice]").forEach(x=>x.disabled=true);if(+b.dataset.choice===p.a)score++;stage++;nextStep.disabled=false;nextStep.innerHTML=stage>=5?"See result →":"Next puzzle →";}));
 nextStep.disabled=true;nextStep.textContent="Choose an answer";nextStep.onclick=()=>{if(stage===i)return;patternAdvance();};
}
function finishActivity(name,points,total,description,detail=""){
 clearTimeout(timer);const record={name,points,total,description,detail,date:new Date().toISOString()};
 const history=getHistory();history.unshift(record);localStorage.setItem(STORE_KEY,JSON.stringify(history.slice(0,50)));
 modalEyebrow.textContent="ACTIVITY COMPLETE";modalTitle.textContent="Nice work showing up.";
 modalBody.innerHTML=`<div class="result-box"><strong>${points} / ${total}</strong><p>${escapeHtml(description)}</p></div><p>${detail?`Matched words: ${escapeHtml(detail)}. `:""}Remember: this is an original practice activity and the score is not a medical measurement.</p>`;
 nextStep.disabled=false;nextStep.innerHTML="Done ✓";nextStep.onclick=closeModal;$("#cancelActivity").textContent="Close";renderHistory();
}
function getHistory(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||"[]")}catch{return []}}
function renderHistory(){
 const h=getHistory();$("#sessionCount").textContent=`${h.length} session${h.length===1?"":"s"}`;
 if(!h.length){$("#historyList").innerHTML=`<div class="empty-state"><span>◷</span><b>Your journey starts here</b><p>Complete an activity to see your results.</p></div>`;return}
 $("#historyList").innerHTML=h.slice(0,6).map(r=>`<div class="history-item"><div><b>${escapeHtml(r.name)}</b><small>${new Date(r.date).toLocaleString()}</small></div><span class="score-pill">${r.points}/${r.total}</span></div>`).join("");
}
function downloadReport(){
 const h=getHistory();const report={title:"MindCare Assess — Educational Activity Report",generatedAt:new Date().toISOString(),disclaimer:"This report contains original practice activity scores only. It is not a clinical assessment or diagnosis.",sessions:h};
 const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mindcare-activity-report.json";a.click();URL.revokeObjectURL(a.href);
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
renderHistory();