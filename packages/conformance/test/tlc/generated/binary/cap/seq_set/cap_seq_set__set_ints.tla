(*---
description: cap of seq_set, a UserValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_seq_set__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \cap ({2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    2
    is an element of Seq({1}).
    2158:0 Attempted to check if the value:
    2
    is an element of Seq({1}).
---*)
