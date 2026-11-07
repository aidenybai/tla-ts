(*---
description: Asks whether subset is in seq_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_seq_set__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \in (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {{}, {1}, {2}, {1, 2}}
    is an element of Seq({1}).
    2158:0 Attempted to check if the value:
    {{}, {1}, {2}, {1, 2}}
    is an element of Seq({1}).
---*)
