(*---
description: Sets a constant to too_big through override, then uses it through equal_itself.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  CONSTANT c <- 2147483648
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_override__too_big__equal_itself ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(c = c)
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for c with the undefined identifier 2147483648.
---*)
