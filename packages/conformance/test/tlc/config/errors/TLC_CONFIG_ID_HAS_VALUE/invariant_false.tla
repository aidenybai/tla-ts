(*---
description: An invariant that is constantly FALSE is rejected before any state is checked.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: config-error
config: |
  INIT Init
  NEXT Next
  INVARIANT K
---*)
---- MODULE invariant_false ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Sp == Init /\ [][Next]_x
K == FALSE
I == 3
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The invariant of K is equal to FALSE
---*)
