(*---
description: diff of set_filter, a SetPredValue, and record, a RecordValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_filter__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \ ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_set_filter__record failed.
    Attempted to check if element:
    2
    is in the record:
    [a |-> 1, b |-> 2]
---*)
