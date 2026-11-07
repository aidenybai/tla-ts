(*---
description: Compares function_empty, a FcnRcdValue, with function_empty, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) = ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
