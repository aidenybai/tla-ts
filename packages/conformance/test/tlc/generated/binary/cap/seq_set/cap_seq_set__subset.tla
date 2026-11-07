(*---
description: cap of seq_set, a UserValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_seq_set__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \cap (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {}
    is an element of Seq({1}).
    2158:0 Attempted to check if the value:
    {}
    is an element of Seq({1}).
---*)
