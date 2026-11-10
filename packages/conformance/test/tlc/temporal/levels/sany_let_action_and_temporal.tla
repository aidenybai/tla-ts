(*---
description: 'SANY''s mix check runs through a named action, as levels are computed for the definition.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_let_action_and_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
A == x' = 1
Prop == A /\ <>(x = 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 17, col 9 to line 17, col 22 of module sany_let_action_and_temporal
    | \land has both temporal formula and action as arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
