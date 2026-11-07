(*---
description: copies_in applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE copies_in_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CopiesIn(1, 1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
