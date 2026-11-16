(*---
description: cross of set_empty, a SetEnumValue, and string_a, a StringValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
