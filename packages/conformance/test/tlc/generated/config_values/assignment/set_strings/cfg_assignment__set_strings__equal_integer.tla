(*---
description: Sets a constant to set_strings through assignment, then uses it through equal_integer.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  CONSTANT c = {"a", "b"}
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_assignment__set_strings__equal_integer ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(c = 1)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 20 of module cfg_assignment__set_strings__equal_integer failed.
    Attempted to check equality of the set {"a", "b"} with the value:
    1
---*)
