(*---
description: field_of applied to record, a RecordValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
