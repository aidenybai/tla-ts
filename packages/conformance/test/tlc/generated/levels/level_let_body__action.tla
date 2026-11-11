(*---
description: Level-checks a action-level expression in let_body.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_let_body__action ----
CONSTANT c
VARIABLE x
Op == LET d == x' IN d
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter c is not assigned a value by the configuration file.
---*)
