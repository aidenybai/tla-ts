(*---
description: except_key applied to model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE except_key_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT([<<1, 2>> EXCEPT ![mv] = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module except_key_model_value failed.
    Attempted to access tuple at a non integral index: mv
---*)
