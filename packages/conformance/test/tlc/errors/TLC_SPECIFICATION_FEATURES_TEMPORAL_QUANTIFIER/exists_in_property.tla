(*---
description: "A temporal existential in a PROPERTY isn't this code: the liveness translator reports that it can't handle the formula."
ref: tlc2/tool/liveness/Liveness.java#astToLive
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE exists_in_property ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Prop == \EE y : []TRUE
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 15, col 9 to line 15, col 22 of module exists_in_property
---*)
