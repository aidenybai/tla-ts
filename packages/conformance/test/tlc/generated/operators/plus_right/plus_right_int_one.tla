(*---
description: plus_right applied to int_one, a IntValue.
ref: tlc2/module/Naturals.java#Plus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_right_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 + 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
