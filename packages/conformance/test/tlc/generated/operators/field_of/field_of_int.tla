(*---
description: field_of applied to int, a UserValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_int failed.
    Attempted to select field "a" from a non-record value Int
    line 14, col 16 to line 14, col 22 of module field_of_int
---*)
