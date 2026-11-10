(*---
description: Level-checks a constant-level expression in leads_to.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_leads_to__constant ----
CONSTANT c
VARIABLE x
Op == (c) ~> (x = 0)
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter c is not assigned a value by the configuration file.
---*)
