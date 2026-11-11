(*---
description: subseteq of union, a UnionValue, and record_nested, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_union__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \subseteq ([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_union__record_nested failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> [b |-> <<1>>]]
---*)
