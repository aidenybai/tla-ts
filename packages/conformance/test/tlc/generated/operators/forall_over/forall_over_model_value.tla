(*---
description: forall_over applied to model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
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
---- MODULE forall_over_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(\A e \in mv : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module forall_over_model_value failed.
    TLC encountered a non-enumerable quantifier bound
    mv.
    line 17, col 25 to line 17, col 26 of module forall_over_model_value
---*)
