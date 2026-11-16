(*---
description: apply of interval_empty, a IntervalValue, and string_escapes, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_interval_empty__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1)["a\"b\\c\n"])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_interval_empty__string_escapes failed.
    A non-function (a set of the form i..j) was applied as a function.
    line 14, col 16 to line 14, col 34 of module apply_interval_empty__string_escapes
---*)
