(*---
description: Sets a constant to self through override, then uses it through equal_string.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  CONSTANT c <- c
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_override__self__equal_string ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(c = "a")
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2223:1 In the configuration file, the identifier c appears
    on the right-hand side of a <- after already appearing on the
    left-hand side of one.
---*)
