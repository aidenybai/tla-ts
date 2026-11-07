(*---
description: 'A quantifier over a state-dependent set cannot be enumerated in astToLive, so the contexts failure turns into TLC_LIVE_CANNOT_HANDLE_FORMULA with the nested reason.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE forall_of_non_constant_set ----
EXTENDS Naturals
VARIABLE pc
S == {1, 2}
Step(p) == pc[p] = 0 /\ pc' = [pc EXCEPT ![p] = 1]
Next == \E p \in S : Step(p)
Init == pc = [p \in S |-> 0]
Prop == <>(\A p \in S : pc[p] = 1)

Spec == Init /\ [][Next]_pc /\ \A p \in {q \in S : pc[q] = 0} : WF_pc(Step(p))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2280:0 In evaluation, the identifier pc is either undefined or not an operator.
    line 20, col 52 to line 20, col 53 of module forall_of_non_constant_set
    2280:0 In evaluation, the identifier pc is either undefined or not an operator.
    line 20, col 52 to line 20, col 53 of module forall_of_non_constant_set
---*)
