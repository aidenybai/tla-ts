(*---
description: Asks whether seq_set is in set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfRcdsValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_of_records__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \in ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_of_records__seq_set failed.
    Attempted to check if non-record
    Seq({1})
    is in the set of records:
    {[a |-> 1], [a |-> 2]}
---*)
