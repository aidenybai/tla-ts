(*---
description: less_left applied to int_one, a IntValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 < 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
