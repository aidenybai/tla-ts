(*---
description: copies_in applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE copies_in_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CopiesIn(1, [x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
