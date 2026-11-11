(*---
description: Compares function, a FcnRcdValue, with function_empty, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) = ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
