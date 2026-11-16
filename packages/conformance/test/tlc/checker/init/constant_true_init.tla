(*---
description: An Init that doesn't mention a variable, even TRUE, is rejected as a constant-level initial predicate.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInitAndNext
outcome: config-error
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE constant_true_init ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2233:1 The initial predicate Init cannot be a constant.
---*)
