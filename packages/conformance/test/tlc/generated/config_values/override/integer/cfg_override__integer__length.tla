(*---
description: Sets a constant to integer through override, then uses it through length.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  CONSTANT c <- 1
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_override__integer__length ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(Len(c))
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for c with the undefined identifier 1.
---*)
