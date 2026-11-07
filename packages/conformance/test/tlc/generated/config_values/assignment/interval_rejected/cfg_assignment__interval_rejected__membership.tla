(*---
description: Sets a constant to interval_rejected through assignment, then uses it through membership.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
outcome: any
config: |
  CONSTANT c = 1..2
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
---*)
---- MODULE cfg_assignment__interval_rejected__membership ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(1 \in c)
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting = or <-, but did not find it.
---*)
