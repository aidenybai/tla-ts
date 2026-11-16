(*---
description: apply of int_negative, a IntValue, and record, a RecordValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_int_negative__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3)[[a |-> 1, b |-> 2]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_int_negative__record failed.
    A non-function (an integer) was applied as a function.
    line 14, col 16 to line 14, col 39 of module apply_int_negative__record
---*)
