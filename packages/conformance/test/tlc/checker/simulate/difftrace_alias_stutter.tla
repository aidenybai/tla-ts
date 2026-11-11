(*---
description: With an ALIAS, -difftrace in simulation compares the state fingerprints, which may stutter under the alias.
ref: tlc2/tool/Simulator.java#printBehavior
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
args:
  - -simulate
  - num=1
  - -depth
  - "10"
  - -difftrace
---*)
---- MODULE difftrace_alias_stutter ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 3
A == [half |-> x \div 2]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 20, col 9 to line 20, col 13 of module difftrace_alias_stutter>
    half = 0
    2217:4 2: <Next line 21, col 9 to line 21, col 18 of module difftrace_alias_stutter>
    2217:4 3: <Next line 21, col 9 to line 21, col 18 of module difftrace_alias_stutter>
    half = 1
    2217:4 4: <Next line 21, col 9 to line 21, col 18 of module difftrace_alias_stutter>
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
---*)
