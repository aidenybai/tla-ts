(*---
description: 'BUG: the mislabeling of recursive_temporal_with_conj without recursion: a definition of temporal level whose constant guard selects FALSE, inside a disjunction, becomes an LNAction and classifyExpr rejects it.'
ref: tlc2/tool/liveness/Liveness.java#astToLive
features: [liveness, tlc-bug]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE operator_constant_false_branch_of_temporal_body ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
F == IF 1 = 1 THEN FALSE ELSE <>(x = 1)
Prop == F \/ <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
