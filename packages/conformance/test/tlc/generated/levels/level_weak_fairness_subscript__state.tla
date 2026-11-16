(*---
description: Level-checks a state-level expression in weak_fairness_subscript.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_weak_fairness_subscript__state ----
CONSTANT c
VARIABLE x
Op == WF_(x)(x' = x)
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter c is not assigned a value by the configuration file.
---*)
