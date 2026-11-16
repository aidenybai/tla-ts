(*---
description: Compares function_strings, a FcnRcdValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function_strings__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_function_strings__cross failed.
    Attempted to check equality of the function [a |-> "a", b |-> "b"] with the value:
    {<<1, 3>>, <<2, 3>>}
---*)
