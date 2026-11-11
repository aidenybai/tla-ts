(*---
description: diff of set_cap, a SetCapValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_cap__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \ ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_set_cap__set_of_records failed.
    Attempted to check if non-record
    2
    is in the set of records:
    {[a |-> 1], [a |-> 2]}
---*)
