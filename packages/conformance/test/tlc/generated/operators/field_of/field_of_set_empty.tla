(*---
description: field_of applied to set_empty, a SetEnumValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_set_empty failed.
    Attempted to select field "a" from a non-record value {}
    line 14, col 16 to line 14, col 21 of module field_of_set_empty
---*)
