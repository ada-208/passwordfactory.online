// ===================== Password generator =====================

const CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
};

const SIMILAR_CHARS = "il1IoO0";

const lengthRange = document.getElementById("lengthRange");
const lengthValue = document.getElementById("lengthValue");
const optUpper = document.getElementById("optUpper");
const optLower = document.getElementById("optLower");
const optNumbers = document.getElementById("optNumbers");
const optSymbols = document.getElementById("optSymbols");
const optExclude = document.getElementById("optExclude");
const generateBtn = document.getElementById("generateBtn");
const regenBtn = document.getElementById("regenBtn");
const copyBtn = document.getElementById("copyBtn");
const passwordOutput = document.getElementById("passwordOutput");
const strengthFill = document.getElementById("strengthFill");
const strengthLabel = document.getElementById("strengthLabel");
const errorMsg = document.getElementById("errorMsg");
const copyStatus = document.getElementById("copyStatus");
const yearEl = document.getElementById("year");

function stripSimilar(str) {
  return str.split("").filter(ch => !SIMILAR_CHARS.includes(ch)).join("");
}

function buildCharset() {
  let charset = "";
  if (optUpper.checked) charset += CHARSETS.upper;
  if (optLower.checked) charset += CHARSETS.lower;
  if (optNumbers.checked) charset += CHARSETS.numbers;
  if (optSymbols.checked) charset += CHARSETS.symbols;
  if (optExclude.checked) charset = stripSimilar(charset);
  return charset;
}

// Rejection sampling avoids modulo bias when mapping random bytes to charset indices.
function secureRandomIndex(max) {
  const range = 256 - (256 % max);
  const buf = new Uint8Array(1);
  let value;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= range);
  return value % max;
}

function generatePassword(length, charset) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[secureRandomIndex(charset.length)];
  }
  return result;
}

function calculateStrength(length, charsetSize) {
  if (charsetSize === 0 || length === 0) return { score: 0, label: "—" };
  const entropy = length * Math.log2(charsetSize);
  if (entropy < 40) return { score: 25, label: "Weak" };
  if (entropy < 60) return { score: 50, label: "Fair" };
  if (entropy < 80) return { score: 75, label: "Strong" };
  return { score: 100, label: "Very strong" };
}

function updateStrengthMeter(score, label) {
  strengthFill.style.width = score + "%";
  strengthLabel.textContent = label;
  if (score <= 25) strengthFill.style.background = "var(--bad)";
  else if (score <= 50) strengthFill.style.background = "var(--warn)";
  else strengthFill.style.background = "var(--good)";
}

function runGenerate() {
  const length = parseInt(lengthRange.value, 10);
  const charset = buildCharset();

  if (!charset) {
    errorMsg.textContent = "Select at least one character type.";
    passwordOutput.value = "";
    updateStrengthMeter(0, "—");
    return;
  }
  errorMsg.textContent = "";

  const password = generatePassword(length, charset);
  passwordOutput.value = password;

  const { score, label } = calculateStrength(length, charset.length);
  updateStrengthMeter(score, label);
  copyStatus.textContent = "";
}

lengthRange.addEventListener("input", () => {
  lengthValue.textContent = lengthRange.value;
  runGenerate();
});

[optUpper, optLower, optNumbers, optSymbols, optExclude].forEach(el => {
  el.addEventListener("change", runGenerate);
});

generateBtn.addEventListener("click", runGenerate);
regenBtn.addEventListener("click", runGenerate);

copyBtn.addEventListener("click", async () => {
  if (!passwordOutput.value) return;
  try {
    await navigator.clipboard.writeText(passwordOutput.value);
    copyStatus.textContent = "Copied to clipboard.";
  } catch (err) {
    passwordOutput.select();
    document.execCommand("copy");
    copyStatus.textContent = "Copied to clipboard.";
  }
  setTimeout(() => (copyStatus.textContent = ""), 2000);
});

if (yearEl) yearEl.textContent = new Date().getFullYear();

// Initial password on load
runGenerate();
