(*---
description: 'With an init and box present, a temporal quantifier inside a disjunctive fairness conjunct reaches astToLive, which cannot handle it.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE temporal_quantifier_in_fairness_disjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == Init /\ [][Next]_x /\ ((\EE y : y = y) \/ WF_x(Next))
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 17, col 33 to line 17, col 45 of module temporal_quantifier_in_fairness_disjunct
---*)
