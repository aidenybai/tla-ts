(*---
description: field_of applied to cross, a SetOfTuplesValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_cross failed.
    Attempted to select field "a" from a non-record value {<<1, 3>>, <<2, 3>>}
    line 14, col 16 to line 14, col 32 of module field_of_cross
---*)
