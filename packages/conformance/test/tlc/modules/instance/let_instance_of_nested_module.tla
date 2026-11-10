(*---
description: "A LET INSTANCE of a nested module draws a false module redefinition error, since the dependency scan treats it as external and the monolith fallback extracts the nested module a second time."
ref: "tla2sany/modanalyzer/ParseUnit.java#getInstances"
features: [instance, tlc-bug]
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
---- MODULE let_instance_of_nested_module ----
---- MODULE I ----
A == 1
====
Test == LET M == INSTANCE I IN M!A = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 19, col 1 to line 21, col 4 of module let_instance_of_nested_module
    | Multiply-defined module 'I': this definition or declaration conflicts 
    | with the one at line 1, col 1 to line 3, col 4 of module I.
    3002:1 Parsing or semantic analysis failed.
---*)
