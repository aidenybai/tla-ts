(*---
description: "The arity check on definition parameters only looks at the last parameter, so an operator parameter in an earlier position passes the check against the declaration of two plain parameters."
ref: "tla2sany/semantic/Generator.java#processOperator"
features: [recursive, tlc-bug]
outcome: success
correct:
  all:
    exit: 150
    transcript: |-
      | Semantic errors:
      | *** Errors: 1
      | line 18, col 1 to line 18, col 15 of module definition_operator_param_last_only
      | Definition of F has different arity than its RECURSIVE declaration.
      3002:1 Parsing or semantic analysis failed.
---*)
---- MODULE definition_operator_param_last_only ----
RECURSIVE F(_, _)
F(G(_), y) == y
ASSUME F(LAMBDA a : a, 1) = 1
====

(*--- recorded
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
