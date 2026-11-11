(*---
description: cross of set_empty, a SetEnumValue, and string_set, a UserValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
