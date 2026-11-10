(*---
description: In ENABLED, an action that assigns x' and then says UNCHANGED x warns, and the action isn't enabled.
ref: tlc2/tool/impl/Tool.java#enabledUnchangedImpl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE enabled_prime_then_unchanged ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
A == x' = 1 /\ UNCHANGED x
Next == x' = 0
Inv == ENABLED A
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2143:3 The variable x was changed while it is specified as UNCHANGED at
    line 14, col 26 to line 14, col 26 of module enabled_prime_then_unchanged
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
---*)
