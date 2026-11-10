(*---
description: "\\X(A, B) parses as an ordinary application of the \\X built-in, which has no body for TLC to evaluate, so TLC fails with a null pointer message instead of building the product or rejecting the syntax."
ref: "tla2sany/semantic/Generator.java#generateOpAppl"
features: [operators, tlc-bug]
outcome: evaluation-failure
correct:
  all:
    exit: 0
    transcript: |-
      2190:0 Finished computing initial states: 0 distinct states generated at <date>.
      2193:0 Model checking completed. No error has been found.
        Estimates of the probability that TLC did not check all reachable states
        because two distinct states had the same fingerprint:
        calculated (optimistic):  val = 0.0
      2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 0.
---*)
---- MODULE nonfix_cross_is_tlc_null_pointer ----
ASSUME \X({1}, {2}) = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 19, col 8 to line 19, col 32 of module nonfix_cross_is_tlc_null_pointer failed.
    Cannot invoke "tla2sany.semantic.SemanticNode.getKind()" because "expr" is null
---*)
