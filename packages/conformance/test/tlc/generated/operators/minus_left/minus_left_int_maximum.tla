(*---
description: minus_left applied to int_maximum, a IntValue.
ref: tlc2/module/Naturals.java#Minus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE minus_left_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2147483646"
---*)
