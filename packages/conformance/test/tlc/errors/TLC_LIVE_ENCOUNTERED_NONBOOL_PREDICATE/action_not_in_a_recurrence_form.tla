(*---
description: Without the []<> or <>[] prefix, the same action is refused during startup with a message about the forms.
ref: tlc2/tool/liveness/Liveness.java#astToLive
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE action_not_in_a_recurrence_form ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Prop == <><<x' + 1>>_x
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
