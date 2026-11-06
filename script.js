/* Scam or Safe? | Mini-Game 2 (Class IX Digital Technology and Innovation)
   The code follows the algorithm steps in the Mini-games document. */

// ---- Scenario bank (step 3: messages, requests and login prompts to choose from) ----
const SCENARIOS = [
  { where: "SMS from an unknown number", text: "Your account will be closed today. Tap this link and log in now.", answer: "scam",
    why: "Pressure to act now and a link from an unknown sender.", flag: "Red flags: pressure, unknown link, asks you to log in." },
  { where: "Your friend, face to face", text: "Can I have your wallet address? I want to send you Nu 500.", answer: "safe",
    why: "A wallet address is public. It only lets people send money to you.", flag: "Public information: wallet address." },
  { where: "Phone call", text: "I am from your bank. Tell me the OTP you just received to stop a wrong payment.", answer: "scam",
    why: "Real banks never ask for your OTP. This is impersonation.", flag: "Red flag: asks for private information (OTP)." },
  { where: "At a local shop", text: "You scan the shop’s QR code with your own payment app and check the name before paying.", answer: "safe",
    why: "You used your own official app and checked who you were paying.", flag: "Safe habit: check before you pay." },
  { where: "Social media post", text: "Send Nu 1,000 now and get Nu 5,000 back tomorrow. Guaranteed profit!", answer: "scam",
    why: "Promises of quick, guaranteed profit are a classic scam.", flag: "Red flag: sounds too good to be true." },
  { where: "Email", text: "Dear Customer, verify your account at the link below. There are spelling mistakes in the message.", answer: "scam",
    why: "A general greeting, a link and spelling mistakes point to phishing.", flag: "Red flags: “Dear Customer”, odd spelling, link." },
  { where: "Your phone settings", text: "You turn on fingerprint lock for your wallet app and set a strong PIN.", answer: "safe",
    why: "Strong authentication keeps other people out of your wallet.", flag: "Safe habit: lock your wallet." },
  { where: "Chat message", text: "Hi, it’s me. Send me your PIN so I can fix your app.", answer: "scam",
    why: "Nobody should ever ask for your PIN, even someone who seems to be a friend.", flag: "Red flag: asks for your PIN." },
  { where: "After an unexpected message", text: "You do not tap the link. You open your bank app yourself to check your account.", answer: "safe",
    why: "Going to the official app yourself avoids fake links.", flag: "Safe habit: do not tap unknown links." },
  { where: "At home", text: "You write your recovery phrase on paper and keep it in a safe place at home. You tell no one.", answer: "safe",
    why: "A private backup lets you recover your wallet and no one else can use it.", flag: "Safe habit: private, offline backup." },
  { where: "SMS", text: "Your parcel is held at the post office. Pay Nu 300 at this link to release it.", answer: "scam",
    why: "A fake payment link that asks for money from an unknown sender.", flag: "Red flags: unexpected message, payment link." },
  { where: "Choosing a PIN", text: "You choose a PIN that is not your birthday and you tell it to nobody.", answer: "safe",
    why: "A PIN that is hard to guess and kept secret protects your money.", flag: "Safe habit: strong, private PIN." }
];

// ---- Step 2: set score and number of scenarios ----
const NUM_SCENARIOS = 10;
const POINTS_CORRECT = 10;   // points added for a correct answer
const POINTS_WRONG = 5;      // points taken away for a wrong answer
let score, round, deck, answered, history;

const $ = (id) => document.getElementById(id);

// ---- Sound effects (made with the browser, no sound files needed) ----
let audioCtx = null, soundOn = true;
function playSound(type) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t0 = audioCtx.currentTime;
    const notes = type === "correct"
      ? [{ f: 523, d: 0 }, { f: 659, d: .09 }, { f: 784, d: .18 }, { f: 1047, d: .27 }]   // happy rising chime
      : [{ f: 220, d: 0 }, { f: 165, d: .16 }];                                           // low "wrong" buzz
    notes.forEach((n) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type === "correct" ? "triangle" : "sawtooth";
      o.frequency.value = n.f;
      g.gain.setValueAtTime(0.0001, t0 + n.d);
      g.gain.exponentialRampToValueAtTime(type === "correct" ? 0.28 : 0.2, t0 + n.d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d + (type === "correct" ? 0.22 : 0.3));
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t0 + n.d); o.stop(t0 + n.d + 0.35);
    });
  } catch (err) { /* sound is optional: the game still works without it */ }
}
$("soundBtn").onclick = () => {
  soundOn = !soundOn;
  $("soundBtn").textContent = soundOn ? "Sound: on" : "Sound: off";
  $("soundBtn").classList.toggle("off", !soundOn);
  if (soundOn) playSound("correct");
};

function shuffle(list) {
  const a = list.slice();
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

// ---- Step 1: start the game ----
function startGame() {
  score = 0;                                                // step 2
  round = 0;
  history = [];
  deck = shuffle(SCENARIOS).slice(0, NUM_SCENARIOS);        // step 3: random selection
  $("intro").classList.add("hide");
  $("end").classList.add("hide");
  $("play").classList.remove("hide");
  showScenario();
}

// ---- Step 4: display the scenario ----
function showScenario() {
  answered = false;
  const s = deck[round];
  $("progress").textContent = "Message " + (round + 1) + " of " + NUM_SCENARIOS;
  $("score").textContent = score + " pts";
  renderTray();
  $("feedback").innerHTML = "";
  $("hint").classList.remove("hide");
  $("stage").innerHTML =
    '<div class="card" id="card"><div class="where">' + s.where + '</div>' +
    '<div class="text">' + s.text + '</div><div class="stamp" id="stamp"></div></div>';
  $("actions").innerHTML =
    '<button class="btn-scam" id="scamBtn">Scam</button><button class="btn-safe" id="safeBtn">Safe</button>';
  $("scamBtn").onclick = () => decide("scam");
  $("safeBtn").onclick = () => decide("safe");
  if (round === 0) $("card").classList.add("wiggle");   // shows students the card can be swiped
  enableSwipe($("card"));
}

// ---- Step 5: player swipes Left = Scam or Right = Safe (or taps a button) ----
function enableSwipe(card) {
  let startX = null, dx = 0;
  const stamp = $("stamp");
  // While dragging: tint the card, light up the guide and show a faint stamp
  const lean = (d) => {
    const dir = d < -15 ? "scam" : d > 15 ? "safe" : null;
    card.classList.toggle("lean-scam", dir === "scam");
    card.classList.toggle("lean-safe", dir === "safe");
    $("swipeL").classList.toggle("active", dir === "scam");
    $("swipeR").classList.toggle("active", dir === "safe");
    if (dir) {
      stamp.textContent = dir.toUpperCase();
      stamp.style.opacity = Math.min(1, Math.abs(d) / 90);
      stamp.style.transform = "rotate(-8deg) scale(1)";
    } else { stamp.style.opacity = ""; stamp.style.transform = ""; }
  };
  card.onpointerdown = (e) => {
    if (answered) return;
    startX = e.clientX;
    card.classList.remove("wiggle");
    card.classList.add("dragging");
    card.setPointerCapture(e.pointerId);
  };
  card.onpointermove = (e) => {
    if (startX === null || answered) return;
    dx = e.clientX - startX;
    card.style.transform = "translateX(" + dx + "px) rotate(" + dx / 25 + "deg)";
    lean(dx);
  };
  card.onpointerup = card.onpointercancel = () => {
    if (startX === null) return;
    const moved = dx;
    startX = null; dx = 0;
    card.classList.remove("dragging");
    if (answered) return;
    if (moved < -90) decide("scam");        // swipe left
    else if (moved > 90) decide("safe");    // swipe right
    else { card.style.transform = ""; lean(0); }   // not far enough: card springs back
  };
}

// Small celebration for a correct answer
function burst() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#F2A900", "#1F7A52", "#2F6DB5", "#C8372D"];
  for (let k = 0; k < 14; k++) {
    const d = document.createElement("span");
    d.className = "dot";
    d.style.background = colors[k % 4];
    $("stage").appendChild(d);
    const a = Math.random() * Math.PI * 2, r = 90 + Math.random() * 90;
    d.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 },
               { transform: "translate(" + Math.cos(a) * r + "px," + Math.sin(a) * r + "px) scale(.4)", opacity: 0 }],
              { duration: 700, easing: "ease-out" }).onfinish = () => d.remove();
  }
}

// ---- Step 6: system checks the player's decision ----
function decide(choice) {
  if (answered) return;
  answered = true;
  const s = deck[round];
  const correct = (choice === s.answer);

  history.push({ s: s, choice: choice, ok: correct });      // remember every answer for the report
  if (correct) {
    score += POINTS_CORRECT;                                // step 7: +10 for a correct answer
    playSound("correct");
  } else {
    score -= POINTS_WRONG;                                  // 5 points taken away for a wrong answer
    playSound("wrong");
    if (navigator.vibrate) navigator.vibrate(120);
  }
  renderTray();
  $("score").textContent = score + " pts";

  const card = $("card");
  card.style.transform = ""; card.style.borderColor = "";
  card.classList.remove("dragging", "lean-scam", "lean-safe");
  $("swipeL").classList.remove("active"); $("swipeR").classList.remove("active");
  $("stamp").style.opacity = ""; $("stamp").style.transform = "";
  if (correct) burst();
  card.classList.add(s.answer);
  if (!correct) card.classList.add("shake");
  const stamp = $("stamp");
  stamp.textContent = s.answer === "scam" ? "SCAM" : "SAFE";
  stamp.classList.add("show");

  // Step 8: if incorrect, show the correct answer.  Step 9: show the warning or safety explanation.
  const heading = correct ? "Correct! +" + POINTS_CORRECT + " points" : "Not quite. −" + POINTS_WRONG + " points. The correct answer is " + s.answer.toUpperCase() + ".";
  $("feedback").innerHTML =
    '<div class="fb ' + (correct ? "good" : "bad") + '"><b>' + heading + '</b>' + s.why +
    '<div class="flag">' + s.flag + '</div></div>';

  // Step 10: load the next scenario (or finish after the last one)
  const last = round === NUM_SCENARIOS - 1;
  $("hint").classList.add("hide");
  $("actions").innerHTML = '<button class="big" id="nextBtn">' + (last ? "See my score" : "Next message") + '</button>';
  $("nextBtn").focus({ preventScroll: true });
  $("nextBtn").onclick = () => { if (last) endGame(); else { round++; showScenario(); } };
}

// Row of boxes at the top: green = correct, red = wrong, gold outline = current letter
function renderTray() {
  let html = "";
  for (let k = 0; k < NUM_SCENARIOS; k++) {
    if (k < history.length) html += history[k].ok ? '<i class="ok">✓</i>' : '<i class="no">✗</i>';
    else html += '<i class="' + (k === history.length ? "now" : "") + '">·</i>';
  }
  $("tray").innerHTML = html;
}

// ---- End of game: display the result with a table of right and wrong answers ----
function endGame() {
  $("play").classList.add("hide");
  const right = history.filter((h) => h.ok).length, wrong = history.length - right;
  const grade = right === NUM_SCENARIOS ? "Scam Buster" : right >= 8 ? "Sharp Spotter" : right >= 6 ? "Getting there" : "Keep practising";
  const rows = history.map((h, n) =>
    '<tr class="' + (h.ok ? "ok" : "no") + '"><td>' + (n + 1) + '</td>' +
    '<td><b>“' + h.s.text + '”</b><div class="why">' + h.s.why + '</div></td>' +
    '<td><span class="pill ' + h.choice + '">' + h.choice.toUpperCase() + '</span></td>' +
    '<td class="res">' + (h.ok ? "✓ Correct<div class=\"why\">+" + POINTS_CORRECT + " pts</div>" : "✗ Wrong<div class=\"why\">−" + POINTS_WRONG + " pts. Answer: " + h.s.answer.toUpperCase() + "</div>") + '</td></tr>').join("");
  $("end").innerHTML =
    '<h2>Your results</h2><div class="rep-head"><div class="score-big">' + score + ' pts</div>' +
    '<div class="badge">' + grade + '</div></div>' +
    '<p class="maxnote">Out of ' + NUM_SCENARIOS * POINTS_CORRECT + ' possible points</p><div class="counts"><div class="c-ok">✓ ' + right + ' correct</div><div class="c-no">✗ ' + wrong + ' to review</div></div>' +
    '<div class="tablewrap"><table><colgroup><col class="c1"><col><col class="c3"><col class="c4"></colgroup><thead><tr><th>#</th><th>Message</th><th>You said</th><th>Result</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="remember">Remember: stop, think, check.</p>' +
    '<div class="btns"><button class="big" id="againBtn">Play again</button></div>';
  $("end").classList.remove("hide");
  $("againBtn").onclick = startGame;
}

// Keyboard control: left arrow = Scam, right arrow = Safe
document.addEventListener("keydown", (e) => {
  if (answered || $("play").classList.contains("hide")) return;
  if (e.key === "ArrowLeft") decide("scam");
  if (e.key === "ArrowRight") decide("safe");
});
$("startBtn").onclick = startGame;
