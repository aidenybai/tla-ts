(*---
description: apply of function_strings, a FcnRcdValue, and function_strings, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_strings__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x])[[x \in {"a", "b"} |-> x]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_strings__function_strings failed.
    Attempted to check equality of string "a" with non-string:
    [a |-> "a", b |-> "b"]
---*)
