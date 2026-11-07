(*---
description: Compares function, a FcnRcdValue, with colon_greater, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) = (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
