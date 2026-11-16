(*---
description: div_divisor applied to int_minimum, a IntValue.
ref: tlc2/module/Naturals.java#Divide
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE div_divisor_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(7 \div ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
