(*---
description: map_over applied to record_nested, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in [a |-> [b |-> <<1>>]]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module map_over_record_nested failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> [b |-> <<1>>]].
    line 14, col 27 to line 14, col 47 of module map_over_record_nested
---*)
