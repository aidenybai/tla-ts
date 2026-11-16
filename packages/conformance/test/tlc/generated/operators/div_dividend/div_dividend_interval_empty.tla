(*---
description: div_dividend applied to interval_empty, a IntervalValue.
ref: tlc2/module/Naturals.java#Divide
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE div_dividend_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(3..1 \div 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
