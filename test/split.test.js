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

assertEqual(splitter.splitAmount(100n, [100n, 100n, 100n], 0).map(String).join(","), "34,33,33", "equal split target 1");
assertEqual(splitter.splitAmount(100n, [100n, 200n, 300n], 0).map(String).join(","), "17,33,50", "ratio split target 1");
assertEqual(splitter.splitAmount(100n, [100n, 200n, 300n], 1).map(String).join(","), "16,34,50", "ratio split target 2");
assertEqual(splitter.splitAmount(100n, [100n, 200n, 300n], 2).map(String).join(","), "16,33,51", "ratio split target 3");
assertEqual(splitter.splitAmount(100n, [125n, 250n, 625n], 2).map(String).join(","), "12,25,63", "decimal basis split");
assertEqual(splitter.getRemainder(100n, [100n, 200n, 300n]).toString(), "1", "ratio remainder");

assertEqual(splitter.formatAmount(1234567n), "1,234,567", "format amount");
assertEqual(splitter.formatAmountInput("1234567"), "1,234,567", "format amount input");
assertEqual(splitter.formatBasisInput("1234567.899"), "1,234,567.89", "format basis input");
assertEqual(splitter.formatBasisDisplay(123456789n), "1,234,567.89", "format basis display");

assertEqual(splitter.parseAmount("123,456円").value.toString(), "123456", "parse comma and yen");
assertOk(!splitter.parseAmount("12.3").ok, "amount rejects decimal");
assertEqual(splitter.parseBasis("1.25").value.toString(), "125", "basis accepts two decimals");
assertEqual(splitter.parseBasis(".5").value.toString(), "50", "basis accepts leading decimal");
assertOk(!splitter.parseBasis("1.234").ok, "basis rejects more than two decimals");

console.log("split tests passed");
