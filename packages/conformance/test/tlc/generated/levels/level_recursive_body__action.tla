(*---
description: Level-checks a action-level expression in recursive_body.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_recursive_body__action ----
CONSTANT c
VARIABLE x
RECURSIVE R(_)
R(n) == x'
Op == R(1)
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter c is not assigned a value by the configuration file.
---*)
