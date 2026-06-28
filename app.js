(function attachAmountSplitter(global) {
  "use strict";

  const PART_COUNT = 3n;
  const ZERO_AMOUNTS = [0n, 0n, 0n];

  function parseAmount(rawValue) {
    const trimmed = String(rawValue || "").trim();
    if (trimmed === "") {
      return { ok: true, value: 0n };
    }

    const normalized = trimmed.replace(/[,\s￥¥円]/g, "");
    if (!/^\d+$/.test(normalized)) {
      return { ok: false, value: 0n };
    }

    return { ok: true, value: BigInt(normalized) };
  }

  function formatAmount(value) {
    return BigInt(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function splitAmount(totalAmount, remainderTarget) {
    const target = Number(remainderTarget);
    const safeTarget = target >= 0 && target < 3 ? target : 0;
    const total = BigInt(totalAmount);
    const base = total / PART_COUNT;
    const remainder = total % PART_COUNT;

    return ZERO_AMOUNTS.map((_, index) => {
      return base + (index === safeTarget ? remainder : 0n);
    });
  }

  function getRemainder(totalAmount) {
    return BigInt(totalAmount) % PART_COUNT;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      return copied ? Promise.resolve() : Promise.reject(new Error("copy failed"));
    } finally {
      document.body.removeChild(textarea);
    }
  }

  function init(documentRef) {
    const amountInput = documentRef.getElementById("total-amount");
    const errorText = documentRef.getElementById("amount-error");
    const resultOutputs = [0, 1, 2].map((index) => documentRef.getElementById(`result-${index}`));
    const copyButtons = Array.from(documentRef.querySelectorAll("[data-copy-index]"));
    const targetInputs = Array.from(documentRef.querySelectorAll("input[name='remainderTarget']"));
    const splitBars = Array.from(documentRef.querySelectorAll("[data-bar-index]"));
    const summaryTotal = documentRef.getElementById("summary-total");
    const summaryRemainder = documentRef.getElementById("summary-remainder");
    const copyStatus = documentRef.getElementById("copy-status");
    let currentAmounts = ZERO_AMOUNTS;

    function getTargetIndex() {
      const selected = targetInputs.find((input) => input.checked);
      return selected ? Number(selected.value) : 0;
    }

    function setCopyStatus(message) {
      copyStatus.textContent = message;
    }

    function render() {
      const parsed = parseAmount(amountInput.value);
      const targetIndex = getTargetIndex();

      if (!parsed.ok) {
        currentAmounts = ZERO_AMOUNTS;
        errorText.textContent = "金額は0以上の整数で入力してください。";
      } else {
        currentAmounts = splitAmount(parsed.value, targetIndex);
        errorText.textContent = "";
      }

      resultOutputs.forEach((output, index) => {
        output.textContent = formatAmount(currentAmounts[index]);
      });

      splitBars.forEach((bar, index) => {
        bar.classList.toggle("is-remainder-target", index === targetIndex);
      });

      const validTotal = parsed.ok ? parsed.value : 0n;
      summaryTotal.textContent = formatAmount(validTotal);
      summaryRemainder.textContent = formatAmount(parsed.ok ? getRemainder(validTotal) : 0n);
      setCopyStatus("");
    }

    amountInput.addEventListener("input", render);
    amountInput.addEventListener("focus", () => {
      const parsed = parseAmount(amountInput.value);
      if (parsed.ok) {
        amountInput.value = parsed.value === 0n ? "" : parsed.value.toString();
      }
    });
    amountInput.addEventListener("blur", () => {
      const parsed = parseAmount(amountInput.value);
      if (parsed.ok && amountInput.value.trim() !== "") {
        amountInput.value = formatAmount(parsed.value);
      }
      render();
    });

    targetInputs.forEach((input) => {
      input.addEventListener("change", render);
    });

    copyButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const index = Number(button.dataset.copyIndex);
        const text = currentAmounts[index].toString();
        try {
          await copyText(text);
          setCopyStatus(`${index + 1}番目の金額をコピーしました。`);
        } catch (error) {
          setCopyStatus("コピーできませんでした。金額を選択してコピーしてください。");
        }
      });
    });

    render();
  }

  const api = {
    parseAmount,
    formatAmount,
    splitAmount,
    getRemainder
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.AmountSplitter = api;

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => init(document));
  }
})(typeof window !== "undefined" ? window : globalThis);
