(*---
description: colon_greater of int_minimum, a IntValue, and function, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_minimum__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) :> ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-2147483648 :> <<2, 4>>)"
---*)
