(*---
description: A spec with variables and no initial predicate stops.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  NEXT Next
---*)
---- MODULE variables_no_init ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
