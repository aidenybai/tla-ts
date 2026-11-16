(*---
description: equiv applied to model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_equiv
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
---- MODULE equiv_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(mv <=> TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module equiv_model_value failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 17, col 16 to line 17, col 26 of module equiv_model_value
---*)
