(*---
description: tuple_pattern applied to record_nested, a RecordValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in [a |-> [b |-> <<1>>]]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_record_nested failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> [b |-> <<1>>]].
    line 14, col 34 to line 14, col 54 of module tuple_pattern_record_nested
---*)
