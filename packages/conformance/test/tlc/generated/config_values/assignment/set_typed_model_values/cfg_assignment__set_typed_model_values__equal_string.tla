(*---
description: Sets a constant to set_typed_model_values through assignment, then uses it through equal_string.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  CONSTANT c = {t_a, t_b}
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_assignment__set_typed_model_values__equal_string ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(c = "a")
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 22 of module cfg_assignment__set_typed_model_values__equal_string failed.
    Attempted to check equality of the set {t_a, t_b} with the value:
    "a"
---*)
