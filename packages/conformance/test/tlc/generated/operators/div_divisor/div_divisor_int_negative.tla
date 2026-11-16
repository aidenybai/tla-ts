(*---
description: div_divisor applied to int_negative, a IntValue.
ref: tlc2/module/Naturals.java#Divide
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE div_divisor_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(7 \div (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
