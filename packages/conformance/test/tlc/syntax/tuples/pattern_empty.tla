(*---
description: "SANY accepts an empty tuple pattern, but Generator.java counts one binder named >> for it, so TLC cannot bind it and fails with an argument mismatch message that still shows its %1 placeholder."
ref: "tla2sany/parser/TLAplusParser.java#IdentifierTuple"
features: [tuples, tlc-bug, tlc-bug]
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
---- MODULE pattern_empty ----
ASSUME \A <<>> \in {<<>>} : TRUE
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 19, col 8 to line 19, col 32 of module pattern_empty failed.
    2170:0 Argument mismatch in operator application.%1
---*)
