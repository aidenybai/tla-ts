(*---
description: 'SANY rejects <>~A, where the negation does not change the action level.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_negated_action_under_eventually ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == <>~(x' = 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 9 to line 16, col 19 of module sany_negated_action_under_eventually
    | <> followed by action not of form <<A>>_v.
    3002:1 Parsing or semantic analysis failed.
---*)
