(*---
description: if_condition applied to set_map, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_ite
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE if_condition_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF {x + 1 : x \in 1..2} THEN 1 ELSE 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module if_condition_set_map failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as the condition of an IF.
    line 14, col 16 to line 14, col 52 of module if_condition_set_map
---*)
