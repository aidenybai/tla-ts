(*---
description: apply of function_strings, a FcnRcdValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_strings__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x])[{1, 2} \X {3}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_strings__cross failed.
    Attempted to check equality of string "a" with non-string:
    {<<1, 3>>, <<2, 3>>}
---*)
