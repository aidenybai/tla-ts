(*---
description: "An ASSUME reads a constant set in the config file, and can fail on it."
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [assume_theorem]
config: |
  CONSTANT c = 8
outcome: assumption-violation
---*)
---- MODULE assume_uses_config_constant_false ----
CONSTANT c
ASSUME c = 7
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 11, col 8 to line 11, col 12 of module assume_uses_config_constant_false is false.
---*)
