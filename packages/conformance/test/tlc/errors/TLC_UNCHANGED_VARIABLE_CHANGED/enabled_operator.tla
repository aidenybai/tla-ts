(*---
description: UNCHANGED through a definition still finds the variable.
ref: tlc2/tool/impl/Tool.java#enabledUnchangedImpl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE enabled_operator ----
EXTENDS Naturals
VARIABLE x
vars == <<x>>
Init == x = 0
A == x' = 1 /\ UNCHANGED vars
Next == x' = 0
Inv == ENABLED A
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2143:3 The variable x was changed while it is specified as UNCHANGED at
    line 13, col 11 to line 13, col 11 of module enabled_operator
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
---*)
