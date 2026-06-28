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

assertEqual(splitter.splitAmount(100n, [10000n, 10000n, 10000n]).map(String).join(","), "33,33,34", "equal split");
assertEqual(splitter.splitAmount(101n, [10000n, 10000n, 10000n]).map(String).join(","), "34,34,33", "equal split with third difference");
assertEqual(splitter.splitAmount(100n, [10000n, 20000n, 30000n]).map(String).join(","), "17,33,50", "ratio split");
assertEqual(splitter.splitAmount(100n, [12500n, 25000n, 62500n]).map(String).join(","), "13,25,62", "four-decimal basis split");
assertEqual(splitter.getAdjustment(100n, [12500n, 25000n, 62500n]).toString(), "-1", "third difference adjustment");

assertEqual(splitter.formatAmount(1234567n), "1,234,567", "format amount");
assertEqual(splitter.formatAmountInput("1234567"), "1,234,567", "format amount input");
assertEqual(splitter.formatBasisInput("1234567.89999"), "1,234,567.8999", "format basis input");
assertEqual(splitter.formatBasisDisplay(12345678999n), "1,234,567.8999", "format basis display");

assertEqual(splitter.parseAmount("123,456円").value.toString(), "123456", "parse comma and yen");
assertOk(!splitter.parseAmount("12.3").ok, "amount rejects decimal");
assertEqual(splitter.parseBasis("1.2345").value.toString(), "12345", "basis accepts four decimals");
assertEqual(splitter.parseBasis(".5").value.toString(), "5000", "basis accepts leading decimal");
assertOk(!splitter.parseBasis("1.23456").ok, "basis rejects more than four decimals");

console.log("split tests passed");
