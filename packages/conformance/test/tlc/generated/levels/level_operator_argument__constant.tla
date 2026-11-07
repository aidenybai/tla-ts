(*---
description: Level-checks a constant-level expression in operator_argument.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_operator_argument__constant ----
CONSTANT c
VARIABLE x
F(a) == a'
Op == F(c)
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter c is not assigned a value by the configuration file.
---*)
