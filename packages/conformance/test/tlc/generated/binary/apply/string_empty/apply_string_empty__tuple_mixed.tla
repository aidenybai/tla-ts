(*---
description: apply of string_empty, a StringValue, and tuple_mixed, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_empty__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("")[<<1, "a", {TRUE}>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_empty__tuple_mixed failed.
    A non-function (a string) was applied as a function.
    line 14, col 16 to line 14, col 39 of module apply_string_empty__tuple_mixed
---*)
