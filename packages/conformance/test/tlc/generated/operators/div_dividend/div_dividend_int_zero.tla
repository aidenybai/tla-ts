(*---
description: div_dividend applied to int_zero, a IntValue.
ref: tlc2/module/Naturals.java#Divide
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE div_dividend_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(0 \div 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
