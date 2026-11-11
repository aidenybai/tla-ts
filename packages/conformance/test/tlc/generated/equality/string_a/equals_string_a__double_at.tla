(*---
description: Compares string_a, a StringValue, with double_at, a FcnRcdValue.
ref: tlc2/value/impl/StringValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_a__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") = ((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_a__double_at failed.
    Attempted to check equality of string "a" with non-string:
    <<2, 3>>
---*)
