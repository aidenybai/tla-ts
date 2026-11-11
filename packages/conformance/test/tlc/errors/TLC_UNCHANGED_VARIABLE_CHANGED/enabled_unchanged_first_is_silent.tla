(*---
description: With UNCHANGED first the later assignment is an ordinary comparison, so it is false without a warning.
ref: tlc2/tool/impl/Tool.java#enabledUnchangedImpl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE enabled_unchanged_first_is_silent ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
A == UNCHANGED x /\ x' = 1
Next == x' = 0
Inv == ENABLED A
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
---*)
