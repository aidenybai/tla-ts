(*---
description: "'K <- [mod] Alt' replaces K's body in the named module, so that module's other definitions see Alt."
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: success
config: |
  CONSTANT N = 0
  K <- [module_overrides_fixture] Alt
includes:
  - module_overrides_fixture.tla
---*)
---- MODULE operator_in_module ----
EXTENDS Naturals, module_overrides_fixture
Alt == 2
ASSUME Get = 2
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
