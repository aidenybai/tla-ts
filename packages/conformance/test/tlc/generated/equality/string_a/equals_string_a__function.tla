(*---
description: Compares string_a, a StringValue, with function, a FcnRcdValue.
ref: tlc2/value/impl/StringValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_a__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") = ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_a__function failed.
    Attempted to check equality of string "a" with non-string:
    <<2, 4>>
---*)
