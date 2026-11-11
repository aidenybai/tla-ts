(*---
description: field_of applied to set_nested, a SetEnumValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_set_nested failed.
    Attempted to select field "a" from a non-record value {{}, {1}}
    line 14, col 16 to line 14, col 28 of module field_of_set_nested
---*)
