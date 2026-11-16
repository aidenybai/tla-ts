(*---
description: Compares function_strings, a FcnRcdValue, with colon_greater, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function_strings__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) = (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
