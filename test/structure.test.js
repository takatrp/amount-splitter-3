"use strict";

const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const js = fs.readFileSync("app.js", "utf8");

const linkedIds = [
  "total-amount",
  "amount-error",
  "summary-total",
  "summary-remainder",
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

if (!js.includes("`result-${index}`")) {
  throw new Error("Result output lookup is not wired in JavaScript.");
}

if (!html.includes("name=\"remainderTarget\"")) {
  throw new Error("Remainder target radio controls are missing.");
}

if ((html.match(/data-copy-index=/g) || []).length !== 3) {
  throw new Error("Each of the three result amounts must have a copy button.");
}

console.log("structure checks passed");
