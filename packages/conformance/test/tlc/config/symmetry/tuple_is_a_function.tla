(*---
description: A tuple isn't a FcnRcdValue either, so it fails the same check.
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
features:
  - tlc-bug
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  CONSTANT S = {a, b}
  SYMMETRY Sym
correct:
  all:
    exit: 0
    transcript: |-
      2300:3 The set <<1,2>> has been defined to be a symmetry set but contains less than two elements.
      2190:0 Finished computing initial states: 2 distinct states generated at <date>.
      2193:0 Model checking completed. No error has been found.
        Estimates of the probability that TLC did not check all reachable states
        because two distinct states had the same fingerprint:
        calculated (optimistic):  val = 2.2E-19
      2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 1.
      2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
---- MODULE tuple_is_a_function ----
EXTENDS TLC, Naturals
CONSTANT S
VARIABLE x
Init == x \in S
Next == x' = x
Sym == {<<1, 2>>}
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : The symmetry values must be function records.
---*)
