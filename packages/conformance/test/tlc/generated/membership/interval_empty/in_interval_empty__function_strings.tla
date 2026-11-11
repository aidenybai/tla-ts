(*---
description: Asks whether function_strings is in interval_empty, a IntervalValue.
ref: tlc2/value/impl/IntervalValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_interval_empty__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) \in (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
