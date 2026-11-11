(*---
description: Level-checks a state-level expression in enabled.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_enabled__state ----
CONSTANT c
VARIABLE x
Op == ENABLED (x)
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter c is not assigned a value by the configuration file.
---*)
