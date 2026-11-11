(*---
description: colon_greater of int_minimum, a IntValue, and set_cup, a SetCupValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_minimum__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) :> ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-2147483648 :> {1, 2})"
---*)
