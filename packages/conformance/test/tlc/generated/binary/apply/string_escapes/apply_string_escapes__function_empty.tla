(*---
description: apply of string_escapes, a StringValue, and function_empty, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_escapes__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n")[[x \in {} |-> x]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_escapes__function_empty failed.
    A non-function (a string) was applied as a function.
    line 14, col 16 to line 14, col 46 of module apply_string_escapes__function_empty
---*)
