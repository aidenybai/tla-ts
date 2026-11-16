(*---
description: Compares int_maximum, a IntValue, with function_strings, a FcnRcdValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_maximum__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) = ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_int_maximum__function_strings failed.
    Attempted to check equality of integer 2147483647 with non-integer:
    [a |-> "a", b |-> "b"]
---*)
