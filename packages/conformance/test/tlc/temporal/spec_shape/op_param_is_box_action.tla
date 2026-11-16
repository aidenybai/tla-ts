(*---
description: 'BUG: processConfigSpec inlines Machine and accepts a formal parameter inside the box, but Tool.getActionsAppl then casts the formal parameter node to OpDefNode and crashes with a ClassCastException, where the spec is meaningful and should be checked.'
ref: tlc2/tool/impl/Tool.java#getActionsAppl
features: [liveness, tlc-bug]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
correct:
  all:
    exit: 0
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2193:0 Model checking completed. No error has been found.
        Estimates of the probability that TLC did not check all reachable states
        because two distinct states had the same fingerprint:
        calculated (optimistic):  val = 0.0
      2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 3.
      2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
---- MODULE op_param_is_box_action ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Machine(i, n) == i /\ [][n]_x
Spec == Machine(Init, Next)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.ClassCastException
    : class tla2sany.semantic.FormalParamNode cannot be cast to class tla2sany.semantic.OpDefNode (tla2sany.semantic.FormalParamNode and tla2sany.semantic.OpDefNode are in unnamed module of loader 'app')
---*)
