(*---
description: subseteq of set_of_records, a SetOfRcdsValue, and model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
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
---- MODULE subseteq_set_of_records__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([a : {1, 2}]) \subseteq (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module subseteq_set_of_records__model_value failed.
    Attempted to check if the value:
    [a |-> 1]
    is an element of the model value mv
---*)
