(*---
description: Sets a constant to string_empty through override, then uses it through print.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  CONSTANT c <- ""
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_override__string_empty__print ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(c)
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for c with the undefined identifier "".
---*)
