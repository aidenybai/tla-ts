(*---
description: field_of applied to record_nested, a RecordValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b |-> <<1>>]"
---*)
