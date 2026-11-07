(*---
description: apply of record, a RecordValue, and string_a, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_record__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2])["a"])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
