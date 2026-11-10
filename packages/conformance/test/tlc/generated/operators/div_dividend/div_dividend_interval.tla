(*---
description: div_dividend applied to interval, a IntervalValue.
ref: tlc2/module/Naturals.java#Divide
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE div_dividend_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1..3 \div 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..1"
---*)
