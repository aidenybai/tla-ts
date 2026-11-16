(*---
description: 'The property name can be anywhere on the definition stack above the conjunct.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY L
  CHECK_DEADLOCK FALSE
---*)
---- MODULE tautology_warning_nested_name ----
EXTENDS Naturals
VARIABLE x
A == x < 2 /\ x' = x + 1
Prop == <>(x = 2)

Inner == WF_x(A)
L == Inner
Spec == x = 0 /\ [][A]_x /\ L
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2258:3 Implied-temporal checking is a tautology.
    The temporal formula L at line 18, col 1 to line 18, col 10 of module tautology_warning_nested_name equals
    the fairness constraints of the behavior specification Spec at line 19, col 1 to line 19, col 29 of module tautology_warning_nested_name.
    Therefore, checking whether Spec => L using TLC will never result in a violation of L.
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
