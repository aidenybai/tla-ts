(*---
description: Level-checks a temporal-level expression in if_condition.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_if_condition__temporal ----
CONSTANT c
VARIABLE x
Op == IF [](x = 0) THEN 1 ELSE 2
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter c is not assigned a value by the configuration file.
---*)
