(*---
description: "A name with arguments can't be used here: _PERIODIC A."
ref: tlc2/tool/impl/SpecProcessor.java#processPeriodic
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _PERIODIC A
---*)
---- MODULE periodic ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Sp == Init /\ [][Next]_x
A(p) == x = p
====

(*--- recorded
all:
  exit: 151
  transcript: "2228:1 TLC requires periodic not to take any argument, but one was given: A"
---*)
