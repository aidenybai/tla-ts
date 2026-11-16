(*---
description: cross of set_map, a SetEnumValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_map__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \X ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, {}>>, <<2, {1}>>, <<3, {}>>, <<3, {1}>>}"
---*)
