(*---
description: STRING is unequal to an untyped model value.
ref: tlc2/module/Strings.java#compareTo
features:
  - Strings
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE model_value_unequal ----
EXTENDS TLC
CONSTANT mv
Test == STRING # mv
====

(*--- recorded
all:
  exit: 0
---*)
