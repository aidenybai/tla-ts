(*---
description: "A name with arguments can't be used here: VIEW A."
ref: tlc2/tool/impl/Spec.java#getViewSpec
outcome: config-error
config: |
  INIT Init
  NEXT Next
  VIEW A
---*)
---- MODULE view ----
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
  transcript: "2228:1 TLC requires view function not to take any argument, but one was given: A"
---*)
