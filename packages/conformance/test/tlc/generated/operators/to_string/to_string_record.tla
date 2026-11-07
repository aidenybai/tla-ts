(*---
description: to_string applied to record, a RecordValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "[a |-> 1, b |-> 2]"'
---*)
