(*---
description: except_key applied to set_map, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_key_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<1, 2>> EXCEPT ![{x + 1 : x \in 1..2}] = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module except_key_set_map failed.
    Attempted to access tuple at a non integral index: {2, 3}
---*)
