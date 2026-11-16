(*---
description: Compares string_escapes, a StringValue, with function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/StringValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_escapes__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") = ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_escapes__function_lazy failed.
    Attempted to check equality of string "a\"b\\c\n" with non-string:
    [x \in Nat |-> <expression line 14, col 48 to line 14, col 48 of module equals_string_escapes__function_lazy>]
---*)
