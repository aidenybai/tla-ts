(*---
description: if_condition applied to model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_ite
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
---- MODULE if_condition_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(IF mv THEN 1 ELSE 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module if_condition_model_value failed.
    A non-boolean expression (a model value) was used as the condition of an IF.
    line 17, col 16 to line 17, col 34 of module if_condition_model_value
---*)
