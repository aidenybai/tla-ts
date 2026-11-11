(*---
description: "Assumptions of an extended module run before the module's own."
ref: "tla2sany/semantic/ModuleNode.java#copyAssumes"
features: [extends]
includes: [FixOrder.tla]
outcome: success
---*)
---- MODULE assume_order_extended_first ----
EXTENDS FixOrder, TLC
ASSUME PrintT("own one")
ASSUME PrintT("own two")
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "extended"
    | "own one"
    | "own two"
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
