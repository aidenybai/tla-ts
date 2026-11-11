(*---
description: Compares function_empty, a FcnRcdValue, with string_a, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function_empty__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) = ("a"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_function_empty__string_a failed.
    Attempted to check equality of the function <<>> with the value:
    "a"
---*)
