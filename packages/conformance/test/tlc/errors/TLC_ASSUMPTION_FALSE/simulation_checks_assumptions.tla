(*---
description: Simulation runs the assumptions too.
ref: tlc2/tool/Simulator.java#simulate
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
---*)
---- MODULE simulation_checks_assumptions ----
VARIABLE x
Init == x = 0
Next == x' = x
ASSUME FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 16, col 8 to line 16, col 12 of module simulation_checks_assumptions is false.
---*)
