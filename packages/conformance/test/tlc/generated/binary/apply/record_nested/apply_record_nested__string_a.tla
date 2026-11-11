(*---
description: apply of record_nested, a RecordValue, and string_a, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_record_nested__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]])["a"])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b |-> <<1>>]"
---*)
