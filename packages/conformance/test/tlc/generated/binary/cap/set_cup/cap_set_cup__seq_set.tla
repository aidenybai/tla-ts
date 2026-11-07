(*---
description: cap of set_cup, a SetCupValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_cup__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) \cap (Seq({1})))
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
