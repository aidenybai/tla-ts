(*---
description: subseteq of set_of_records, a SetOfRcdsValue, and seq_set, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_of_records__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \subseteq (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of Seq({1}).
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of Seq({1}).
---*)
