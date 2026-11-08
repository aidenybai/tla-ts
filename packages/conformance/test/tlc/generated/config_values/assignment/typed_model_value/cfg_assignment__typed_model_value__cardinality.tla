(*---
description: Sets a constant to typed_model_value through assignment, then uses it through cardinality.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  CONSTANT c = t_a
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_assignment__typed_model_value__cardinality ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(Cardinality(c))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 29 of module cfg_assignment__typed_model_value__cardinality failed.
    2181:0 Attempted to compute cardinality of the value
    t_a
---*)
