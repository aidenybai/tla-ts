(*---
description: map_over applied to model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
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
---- MODULE map_over_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT({e : e \in mv})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module map_over_model_value failed.
    TLC encountered a non-enumerable quantifier bound
    mv.
    line 17, col 27 to line 17, col 28 of module map_over_model_value
---*)
