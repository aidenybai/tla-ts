(*---
description: "An INSTANCE step of a nested module draws a false module redefinition error on the nested module, though the same INSTANCE at module level is fine."
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [proofs, tlc-bug]
outcome: parse-error
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
---- MODULE step_instance_of_nested_module ----
---- MODULE I ----
A == 1
====
THEOREM FALSE
<1> INSTANCE I
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 1 to line 10, col 4 of module step_instance_of_nested_module
    | Multiply-defined module 'I': this definition or declaration conflicts 
    | with the one at line 1, col 1 to line 3, col 4 of module I.
    3002:1 Parsing or semantic analysis failed.
---*)
