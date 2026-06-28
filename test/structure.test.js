"use strict";

const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const js = fs.readFileSync("app.js", "utf8");

const linkedIds = [
  "total-amount",
  "amount-error",
  "basis-error",
  "summary-total",
  "summary-basis",
  "summary-adjustment",
  "copy-status"
];

const missingIds = linkedIds.filter((id) => {
  return !html.includes(`id="${id}"`) || !js.includes(id);
});

if (missingIds.length > 0) {
  throw new Error(`HTML and JS ids are not connected: ${missingIds.join(", ")}`);
}

["result-0", "result-1", "result-2"].forEach((id) => {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Result output is missing: ${id}`);
  }
});

["basis-0", "basis-1", "basis-2"].forEach((id) => {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Basis input is missing: ${id}`);
  }
});

if (!js.includes("`result-${index}`")) {
  throw new Error("Result output lookup is not wired in JavaScript.");
}

if (!js.includes("`basis-${index}`")) {
  throw new Error("Basis input lookup is not wired in JavaScript.");
}

if (html.includes("name=\"remainderTarget\"")) {
  throw new Error("Remainder target radio controls should not be present.");
}

if (!html.includes("按分基準（小数点4位まで）")) {
  throw new Error("Basis input label is missing.");
}

if (!html.includes("3番目調整")) {
  throw new Error("Third difference adjustment summary is missing.");
}

if ((html.match(/data-copy-index=/g) || []).length !== 3) {
  throw new Error("Each of the three result amounts must have a copy button.");
}

console.log("structure checks passed");
