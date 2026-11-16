(*---
description: "A name with arguments can't be used here: ACTION_CONSTRAINT A."
ref: tlc2/tool/impl/SpecProcessor.java#processActionConstraints
outcome: config-error
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT A
---*)
---- MODULE action_constraint ----
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
  transcript: "2228:1 TLC requires action constraint not to take any argument, but one was given: A"
---*)
