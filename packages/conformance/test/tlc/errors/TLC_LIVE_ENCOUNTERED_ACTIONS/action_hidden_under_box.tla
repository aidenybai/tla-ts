(*---
description: "The same action under [] is refused by the translator too."
ref: tlc2/tool/liveness/Liveness.java#astToLive
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CONSTANT C <- G
---*)
---- MODULE action_hidden_under_box ----
EXTENDS Naturals
CONSTANT C(_)
VARIABLE x
G(a) == x' = 9
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Prop == []C(1)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
