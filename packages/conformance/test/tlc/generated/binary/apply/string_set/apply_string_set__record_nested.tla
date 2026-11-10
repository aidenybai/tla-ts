(*---
description: apply of string_set, a UserValue, and record_nested, a RecordValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_string_set__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING)[[a |-> [b |-> <<1>>]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_string_set__record_nested failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 46 of module apply_string_set__record_nested
---*)
