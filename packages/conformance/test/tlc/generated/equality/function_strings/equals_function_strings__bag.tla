(*---
description: Compares function_strings, a FcnRcdValue, with bag, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function_strings__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) = (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
