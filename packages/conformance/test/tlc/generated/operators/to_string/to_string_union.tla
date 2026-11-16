(*---
description: to_string applied to union, a UnionValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{1, 2}"'
---*)
