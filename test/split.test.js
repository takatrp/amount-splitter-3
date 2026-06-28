"use strict";

const splitter = require("../app.js");

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertOk(value, label) {
  if (!value) {
    throw new Error(label);
  }
}

assertEqual(splitter.splitAmount(100n, [1000n, 1000n, 1000n]).map(String).join(","), "33,33,34", "equal split");
assertEqual(splitter.splitAmount(101n, [1000n, 1000n, 1000n]).map(String).join(","), "34,34,33", "equal split with third difference");
assertEqual(splitter.splitAmount(100n, [1000n, 2000n, 3000n]).map(String).join(","), "17,33,50", "ratio split");
assertEqual(splitter.splitAmount(100n, [1250n, 2500n, 6250n]).map(String).join(","), "13,25,62", "three-decimal basis split");
assertEqual(splitter.getAdjustment(100n, [1250n, 2500n, 6250n]).toString(), "-1", "third difference adjustment");

assertEqual(splitter.formatAmount(1234567n), "1,234,567", "format amount");
assertEqual(splitter.formatAmountInput("1234567"), "1,234,567", "format amount input");
assertEqual(splitter.formatBasisInput("1234567.8999"), "1,234,567.899", "format basis input");
assertEqual(splitter.formatBasisDisplay(1234567899n), "1,234,567.899", "format basis display");

assertEqual(splitter.parseAmount("123,456円").value.toString(), "123456", "parse comma and yen");
assertOk(!splitter.parseAmount("12.3").ok, "amount rejects decimal");
assertEqual(splitter.parseBasis("1.234").value.toString(), "1234", "basis accepts three decimals");
assertEqual(splitter.parseBasis(".5").value.toString(), "500", "basis accepts leading decimal");
assertOk(!splitter.parseBasis("1.2345").ok, "basis rejects more than three decimals");

console.log("split tests passed");
