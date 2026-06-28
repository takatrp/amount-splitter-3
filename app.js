(function attachAmountSplitter(global) {
  "use strict";

  const PART_COUNT = 3;
  const BASIS_SCALE = 1000n;
  const ZERO_AMOUNTS = [0n, 0n, 0n];
  const DEFAULT_BASES = [100n, 100n, 100n];

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

  function parseBasis(rawValue) {
    const trimmed = String(rawValue || "").trim();
    if (trimmed === "") {
      return { ok: true, value: 0n };
    }

    const normalized = trimmed.replace(/[,\s]/g, "");
    if (normalized === "." || !/^\d*(?:\.\d{0,3})?$/.test(normalized) || !/\d/.test(normalized)) {
      return { ok: false, value: 0n };
    }

    const parts = normalized.split(".");
    const whole = parts[0] || "0";
    const decimal = (parts[1] || "").padEnd(3, "0").slice(0, 3);

    return {
      ok: true,
      value: BigInt(whole) * BASIS_SCALE + BigInt(decimal)
    };
  }

  function formatAmount(value) {
    return BigInt(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatAmountInput(rawValue) {
    const digits = String(rawValue || "").replace(/[^\d]/g, "");
    return digits === "" ? "" : formatAmount(BigInt(digits));
  }

  function formatBasisDisplay(value) {
    const scaled = BigInt(value);
    const whole = scaled / BASIS_SCALE;
    const decimal = (scaled % BASIS_SCALE).toString().padStart(3, "0");
    return `${formatAmount(whole)}.${decimal}`;
  }

  function formatBasisInput(rawValue) {
    const text = String(rawValue || "");
    const dotIndex = text.indexOf(".");
    const hasDot = dotIndex !== -1;
    const integerSource = hasDot ? text.slice(0, dotIndex) : text;
    const decimalSource = hasDot ? text.slice(dotIndex + 1) : "";
    const integerDigits = integerSource.replace(/[^\d]/g, "");
    const decimalDigits = decimalSource.replace(/[^\d]/g, "").slice(0, 3);
    let formattedInteger = integerDigits === "" ? "" : formatAmount(BigInt(integerDigits));

    if (hasDot) {
      formattedInteger = formattedInteger === "" ? "0" : formattedInteger;
      return `${formattedInteger}.${decimalDigits}`;
    }

    return formattedInteger;
  }

  function normalizeBasisValues(basisValues) {
    const values = Array.isArray(basisValues) ? basisValues.slice(0, PART_COUNT) : DEFAULT_BASES;
    while (values.length < PART_COUNT) {
      values.push(0n);
    }

    return values.map((value) => {
      const basis = BigInt(value || 0);
      return basis > 0n ? basis : 0n;
    });
  }

  function sumValues(values) {
    return values.reduce((sum, value) => sum + value, 0n);
  }

  function roundDivision(numerator, denominator) {
    return (numerator * 2n + denominator) / (denominator * 2n);
  }

  function calculateBaseParts(totalAmount, basisValues) {
    const total = BigInt(totalAmount);
    const bases = normalizeBasisValues(basisValues);
    const basisTotal = sumValues(bases);

    if (basisTotal === 0n) {
      return {
        parts: ZERO_AMOUNTS.slice(),
        adjustment: 0n,
        basisTotal
      };
    }

    const first = roundDivision(total * bases[0], basisTotal);
    const second = roundDivision(total * bases[1], basisTotal);
    const third = total - first - second;
    const parts = [first, second, third];
    const roundedThird = roundDivision(total * bases[2], basisTotal);

    return {
      parts,
      adjustment: third - roundedThird,
      basisTotal
    };
  }

  function splitAmount(totalAmount, basisValues) {
    let bases = basisValues;

    if (!Array.isArray(bases)) {
      bases = DEFAULT_BASES;
    }

    const calculated = calculateBaseParts(totalAmount, bases);
    if (calculated.basisTotal === 0n) {
      return ZERO_AMOUNTS.slice();
    }

    return calculated.parts;
  }

  function getAdjustment(totalAmount, basisValues) {
    return calculateBaseParts(totalAmount, basisValues).adjustment;
  }

  function getBasisTotal(basisValues) {
    return sumValues(normalizeBasisValues(basisValues));
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

  function placeCaretAfterDigits(input, digitCount) {
    if (typeof input.setSelectionRange !== "function") {
      return;
    }

    if (digitCount <= 0) {
      input.setSelectionRange(0, 0);
      return;
    }

    let seen = 0;
    for (let index = 0; index < input.value.length; index += 1) {
      if (/\d/.test(input.value[index])) {
        seen += 1;
      }

      if (seen === digitCount) {
        input.setSelectionRange(index + 1, index + 1);
        return;
      }
    }

    input.setSelectionRange(input.value.length, input.value.length);
  }

  function formatAmountInputElement(input) {
    const caret = input.selectionStart || 0;
    const digitsBeforeCaret = (input.value.slice(0, caret).match(/\d/g) || []).length;
    input.value = formatAmountInput(input.value);
    placeCaretAfterDigits(input, digitsBeforeCaret);
  }

  function init(documentRef) {
    const amountInput = documentRef.getElementById("total-amount");
    const basisInputs = [0, 1, 2].map((index) => documentRef.getElementById(`basis-${index}`));
    const errorText = documentRef.getElementById("amount-error");
    const basisErrorText = documentRef.getElementById("basis-error");
    const resultOutputs = [0, 1, 2].map((index) => documentRef.getElementById(`result-${index}`));
    const copyButtons = Array.from(documentRef.querySelectorAll("[data-copy-index]"));
    const splitBars = Array.from(documentRef.querySelectorAll("[data-bar-index]"));
    const summaryTotal = documentRef.getElementById("summary-total");
    const summaryBasis = documentRef.getElementById("summary-basis");
    const summaryAdjustment = documentRef.getElementById("summary-adjustment");
    const copyStatus = documentRef.getElementById("copy-status");
    let currentAmounts = ZERO_AMOUNTS;

    function getParsedBases() {
      const parsedBases = basisInputs.map((input) => parseBasis(input.value));
      return {
        ok: parsedBases.every((basis) => basis.ok),
        values: parsedBases.map((basis) => basis.value)
      };
    }

    function setCopyStatus(message) {
      copyStatus.textContent = message;
    }

    function render() {
      const parsedAmount = parseAmount(amountInput.value);
      const parsedBases = getParsedBases();
      const basisTotal = parsedBases.ok ? getBasisTotal(parsedBases.values) : 0n;

      if (!parsedAmount.ok) {
        errorText.textContent = "金額は0以上の整数で入力してください。";
      } else {
        errorText.textContent = "";
      }

      if (!parsedBases.ok) {
        basisErrorText.textContent = "按分基準は小数点3位までの0以上の数値で入力してください。";
      } else if (basisTotal === 0n) {
        basisErrorText.textContent = "按分基準を1つ以上入力してください。";
      } else {
        basisErrorText.textContent = "";
      }

      if (parsedAmount.ok && parsedBases.ok && basisTotal > 0n) {
        currentAmounts = splitAmount(parsedAmount.value, parsedBases.values);
      } else {
        currentAmounts = ZERO_AMOUNTS;
      }

      resultOutputs.forEach((output, index) => {
        output.textContent = formatAmount(currentAmounts[index]);
      });

      splitBars.forEach((bar, index) => {
        bar.classList.toggle("is-remainder-target", index === 2);
      });

      const validTotal = parsedAmount.ok ? parsedAmount.value : 0n;
      summaryTotal.textContent = formatAmount(validTotal);
      summaryBasis.textContent = formatBasisDisplay(basisTotal);
      summaryAdjustment.textContent =
        parsedAmount.ok && parsedBases.ok && basisTotal > 0n
          ? formatAmount(getAdjustment(validTotal, parsedBases.values))
          : "0";
      setCopyStatus("");
    }

    amountInput.addEventListener("input", () => {
      formatAmountInputElement(amountInput);
      render();
    });

    basisInputs.forEach((input) => {
      input.addEventListener("input", () => {
        input.value = formatBasisInput(input.value);
        render();
      });
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

    amountInput.value = formatAmountInput(amountInput.value);
    basisInputs.forEach((input) => {
      input.value = formatBasisInput(input.value);
    });
    render();
  }

  const api = {
    parseAmount,
    parseBasis,
    formatAmount,
    formatAmountInput,
    formatBasisDisplay,
    formatBasisInput,
    splitAmount,
    getAdjustment,
    getBasisTotal
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.AmountSplitter = api;

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => init(document));
  }
})(typeof window !== "undefined" ? window : globalThis);
