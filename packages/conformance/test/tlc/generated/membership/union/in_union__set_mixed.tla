(*---
description: Asks whether set_mixed is in union, a UnionValue.
ref: tlc2/value/impl/UnionValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_union__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, "a"}) \in (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_union__set_mixed failed.
    Attempted to compare string "a" with non-string:
    1
---*)
