(*---
description: 'A box of a definition equal to [A]_v is a SANY error rather than an implied action.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE box_square_action_via_definition_rejected ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Sq == [Next]_x
Prop == []Sq
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 17, col 9 to line 17, col 12 of module box_square_action_via_definition_rejected
    | [] followed by action not of form [A]_v.
    3002:1 Parsing or semantic analysis failed.
---*)
