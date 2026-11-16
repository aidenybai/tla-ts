(*---
description: Level-checks a constant-level expression in box_action.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_box_action__constant ----
CONSTANT c
VARIABLE x
Op == [][c]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter c is not assigned a value by the configuration file.
---*)
