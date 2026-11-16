(*---
description: Level-checks a constant-level expression in constant_operator_argument.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_constant_operator_argument__constant ----
CONSTANT c
VARIABLE x
CONSTANT G(_)
Op == G(c)
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter G is not assigned a value by the configuration file.
---*)
