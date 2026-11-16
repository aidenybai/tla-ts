(*---
description: '[]A with an action A and no subscript is a SANY error.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE box_action_without_subscript_rejected ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == []Next
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 9 to line 16, col 14 of module box_action_without_subscript_rejected
    | [] followed by action not of form [A]_v.
    3002:1 Parsing or semantic analysis failed.
---*)
