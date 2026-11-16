(*---
description: field_of applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_set_of_functions failed.
    Attempted to select field "a" from a non-record value {<<2>>, <<3>>}
    line 14, col 16 to line 14, col 34 of module field_of_set_of_functions
---*)
