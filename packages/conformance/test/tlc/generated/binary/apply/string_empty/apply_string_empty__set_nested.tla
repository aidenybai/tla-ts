(*---
description: apply of string_empty, a StringValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_empty__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("")[{{1}, {}}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_empty__set_nested failed.
    A non-function (a string) was applied as a function.
    line 14, col 16 to line 14, col 30 of module apply_string_empty__set_nested
---*)
