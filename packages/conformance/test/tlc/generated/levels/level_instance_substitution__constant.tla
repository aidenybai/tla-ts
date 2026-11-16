(*---
description: Level-checks a constant-level expression in instance_substitution.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_instance_substitution__constant ----
CONSTANT c
VARIABLE x
---- MODULE Inner ----
CONSTANT p
====
I == INSTANCE Inner WITH p <- c
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter c is not assigned a value by the configuration file.
---*)
