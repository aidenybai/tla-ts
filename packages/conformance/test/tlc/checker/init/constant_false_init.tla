(*---
description: An Init of FALSE is rejected as a constant-level initial predicate rather than yielding no states.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInitAndNext
outcome: config-error
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE constant_false_init ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2233:1 The initial predicate Init cannot be a constant.
---*)
