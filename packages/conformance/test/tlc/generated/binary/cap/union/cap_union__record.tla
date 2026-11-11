(*---
description: cap of union, a UnionValue, and record, a RecordValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_union__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \cap ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_union__record failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1, b |-> 2]
---*)
