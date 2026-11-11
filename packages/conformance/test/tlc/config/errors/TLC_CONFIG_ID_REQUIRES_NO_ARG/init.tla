(*---
description: "A name with arguments can't be used here: NEXT Next."
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInitAndNext
outcome: config-error
config: |
  INIT A
  NEXT Next
---*)
---- MODULE init ----
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
  transcript: "2228:1 TLC requires initial predicate not to take any argument, but one was given: A"
---*)
