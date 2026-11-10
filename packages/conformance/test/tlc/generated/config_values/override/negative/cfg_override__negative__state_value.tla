(*---
description: Sets a constant to negative through override, then uses it through state_value.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  INIT Init
  NEXT Next
  CONSTANT c <- -1
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_override__negative__state_value ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
VARIABLE x
Init == x = c
Next == x' = x
ASSUME PrintT(c)
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 4
    It was expecting = or <-, but did not find it.
---*)
