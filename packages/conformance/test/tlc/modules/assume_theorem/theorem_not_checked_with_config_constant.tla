(*---
description: A THEOREM about a constant is not evaluated.
ref: "tla2sany/semantic/Generator.java#processTheorem"
features: [assume_theorem]
flags: [expression]
config: |
  CONSTANT c = 7
outcome: success
---*)
---- MODULE theorem_not_checked_with_config_constant ----
CONSTANT c
THEOREM c = 8
Test == c = 7
====

(*--- recorded
all:
  exit: 0
---*)
