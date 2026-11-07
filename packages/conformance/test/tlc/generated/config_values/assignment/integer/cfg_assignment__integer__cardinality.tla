(*---
description: Sets a constant to integer through assignment, then uses it through cardinality.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  CONSTANT c = 1
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_assignment__integer__cardinality ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(Cardinality(c))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    1
    2181:0 Attempted to compute cardinality of the value
    1
---*)
