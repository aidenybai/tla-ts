(*---
description: UNCHANGED of a tuple goes through the same check for each variable.
ref: tlc2/tool/impl/Tool.java#enabledUnchangedImpl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE enabled_tuple ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
A == x' = 1 /\ UNCHANGED <<x>>
Next == x' = 0
Inv == ENABLED A
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2143:3 The variable x was changed while it is specified as UNCHANGED at
    line 14, col 28 to line 14, col 28 of module enabled_tuple
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
---*)
