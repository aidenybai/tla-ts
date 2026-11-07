(*---
description: cap of seq_set, a UserValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_seq_set__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \cap ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    1
    is an element of Seq({1}).
    2158:0 Attempted to check if the value:
    1
    is an element of Seq({1}).
---*)
