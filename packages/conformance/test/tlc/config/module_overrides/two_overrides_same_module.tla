(*---
description: Each scoped override adds to the same module's table.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: success
config: |
  CONSTANT N = 0
  A <- [module_overrides_fixture] C
  B <- [module_overrides_fixture] D
includes:
  - module_overrides_fixture.tla
---*)
---- MODULE two_overrides_same_module ----
EXTENDS Naturals, module_overrides_fixture
C == 3
D == 4
ASSUME Sum = <<3, 4>>
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
