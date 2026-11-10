(*---
description: field_of applied to interval, a IntervalValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_interval failed.
    Attempted to select field "a" from a non-record value 1..3
    line 14, col 16 to line 14, col 23 of module field_of_interval
---*)
