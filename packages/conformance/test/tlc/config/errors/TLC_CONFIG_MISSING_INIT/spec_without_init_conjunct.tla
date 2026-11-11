(*---
description: A SPECIFICATION with no state-level conjunct gives no initial predicate.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  SPECIFICATION Sp
---*)
---- MODULE spec_without_init_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Sp == [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
