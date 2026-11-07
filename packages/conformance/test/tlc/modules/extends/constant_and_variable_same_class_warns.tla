(*---
description: "A constant and a variable are the same node class, so one name for both is only a warning and the first declaration wins."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
includes: [FixConstant.tla, FixVariable.tla]
config: |
  CONSTANT Shared = 1
outcome: success
---*)
---- MODULE constant_and_variable_same_class_warns ----
EXTENDS FixConstant, FixVariable
ASSUME Shared = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 2, col 10 to line 2, col 15 of module FixVariable
    | Warning: the declaration of 'Shared' conflicts with 
    | its declaration at line 2, col 10 to line 2, col 15 of module FixConstant.
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
