(*---
description: 'BUG: an operator constant substituted by a built-in operator: getLevelBoundAppl recurses into the built-in OpDefNode''s null body and TLC dies with a NullPointerException.'
ref: tlc2/tool/impl/SymbolNodeValueLookupProvider.java#getLevelBoundAppl
features: [liveness, refinement, tlc-bug]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
correct:
  all:
    exit: 0
    transcript: |-
      2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2192:0 Checking 2 branches of temporal properties for the complete state space with 6 total distinct states at (<date>)
      2267:0 Finished checking temporal properties in <time> at <date>
      2193:0 Model checking completed. No error has been found.
        Estimates of the probability that TLC did not check all reachable states
        because two distinct states had the same fingerprint:
        calculated (optimistic):  val = 0.0
      2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 3.
      2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
---- MODULE substitution_of_action_operator_builtin ----
EXTENDS Naturals
VARIABLE x
---- MODULE Ops ----
EXTENDS Naturals
VARIABLE v
CONSTANT Combine(_, _)
G == Combine(<>(v = 1), <>(v = 2))
====
N == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][N]_x /\ WF_x(N)
O == INSTANCE Ops WITH v <- x, Combine <- \land
Prop == O!G
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.NullPointerException
    : Cannot invoke "tla2sany.semantic.SemanticNode.getKind()" because "expr" is null
---*)
