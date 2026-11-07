(*---
description: subseteq of cross, a SetOfTuplesValue, and int, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_cross__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \subseteq (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<1, 3>>
    is an element of Int.
    2158:0 Attempted to check if the value:
    <<1, 3>>
    is an element of Int.
---*)
