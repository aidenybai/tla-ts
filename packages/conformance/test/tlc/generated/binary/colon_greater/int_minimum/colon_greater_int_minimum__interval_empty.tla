(*---
description: colon_greater of int_minimum, a IntValue, and interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_minimum__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) :> (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-2147483648 :> {})"
---*)
