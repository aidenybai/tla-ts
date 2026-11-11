(*---
description: field_of applied to tuple_empty, a TupleValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_tuple_empty failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
