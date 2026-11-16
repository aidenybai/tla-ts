(*---
description: apply of string_a, a StringValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_a__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a")[BOOLEAN])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_a__boolean_set failed.
    A non-function (a string) was applied as a function.
    line 14, col 16 to line 14, col 29 of module apply_string_a__boolean_set
---*)
