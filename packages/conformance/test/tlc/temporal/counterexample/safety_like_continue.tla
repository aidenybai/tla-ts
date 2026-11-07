(*---
description: 'BUG: with -continue, the InvariantViolatedException that ends printErrorTrace is not caught as it is without the flag, so after a correct trace TLC reports an unexpected exception and exits 255.'
ref: tlc2/tool/liveness/LiveCheck.java#printErrorTrace
features: [liveness, tlc-bug]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -continue
---*)
---- MODULE safety_like_continue ----
EXTENDS Naturals, TLC
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [](x = 1 => [](x = 1))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module safety_like_continue>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 27 of module safety_like_continue>
    x = 2
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a tlc2.tool.INextStateFunctor$InvariantViolatedException
    : Invariant violated
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module safety_like_continue>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 27 of module safety_like_continue>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
