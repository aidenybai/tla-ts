(*---
description: 'SANY rejects <=> of an action and a temporal formula, a level case apart from TLC''s own.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_action_and_temporal_in_equiv ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == <>(x = 1) <=> x' = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 9 to line 16, col 28 of module sany_action_and_temporal_in_equiv
    | \equiv has both temporal formula and action as arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
