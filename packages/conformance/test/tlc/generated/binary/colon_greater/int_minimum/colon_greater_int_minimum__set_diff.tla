(*---
description: colon_greater of int_minimum, a IntValue, and set_diff, a SetDiffValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_minimum__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) :> ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-2147483648 :> {1})"
---*)
