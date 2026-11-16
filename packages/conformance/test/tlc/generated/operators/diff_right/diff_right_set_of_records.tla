(*---
description: diff_right applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_right_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ [a : {1, 2}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_right_set_of_records failed.
    Attempted to check if non-record
    1
    is in the set of records:
    {[a |-> 1], [a |-> 2]}
---*)
