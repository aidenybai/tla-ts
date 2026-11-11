(*---
description: 'Fairness for one process lets the other stop: the trace steps the fair process then stutters.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE forall_singleton_leaves_other_unfair ----
EXTENDS Naturals
VARIABLE pc
S == {1, 2}
Step(p) == pc[p] = 0 /\ pc' = [pc EXCEPT ![p] = 1]
Next == \E p \in S : Step(p)
Init == pc = [p \in S |-> 0]
Prop == <>(\A p \in S : pc[p] = 1)

Spec == Init /\ [][Next]_pc /\ \A p \in {1} : WF_pc(Step(p))
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 4 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    pc = <<0, 0>>
    2217:4 2: <Step(1) line 15, col 12 to line 15, col 50 of module forall_singleton_leaves_other_unfair>
    pc = <<1, 0>>
    2218:4 3: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 5 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
