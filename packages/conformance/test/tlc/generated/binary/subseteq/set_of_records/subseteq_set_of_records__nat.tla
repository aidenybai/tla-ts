(*---
description: subseteq of set_of_records, a SetOfRcdsValue, and nat, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_of_records__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \subseteq (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of Nat.
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of Nat.
---*)
