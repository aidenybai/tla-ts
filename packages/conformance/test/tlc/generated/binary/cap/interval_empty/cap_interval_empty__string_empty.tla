(*---
description: cap of interval_empty, a IntervalValue, and string_empty, a StringValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cap (""))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
