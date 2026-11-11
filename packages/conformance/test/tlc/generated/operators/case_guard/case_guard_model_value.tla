(*---
description: case_guard applied to model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_case
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
---- MODULE case_guard_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(CASE mv -> 1 [] OTHER -> 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module case_guard_model_value failed.
    A non-boolean expression (a model value) was used as a condition of a CASE. line 17, col 21 to line 17, col 22 of module case_guard_model_value
---*)
