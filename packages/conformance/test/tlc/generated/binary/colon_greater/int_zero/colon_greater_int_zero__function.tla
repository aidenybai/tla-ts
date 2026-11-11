(*---
description: colon_greater of int_zero, a IntValue, and function, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_zero__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) :> ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> <<2, 4>>)"
---*)
