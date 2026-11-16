(*---
description: TLCGet("config") in simulation mode has mode, depth and traces from the flags.
ref: tlc2/tool/Simulator.java#createConfig
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=1
  - -depth
  - "3"
---*)
---- MODULE config_simulate ----
EXTENDS TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == PrintT(LET c == TLCGet("config") IN [mode |-> c.mode, depth |-> c.depth, traces |-> c.traces, deadlock |-> c.deadlock, seed |-> c.seed, aril |-> c.aril, worker |-> c.worker])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    | [ mode |-> "simulate",
    |   depth |-> 3,
    |   traces |-> 1,
    |   deadlock |-> TRUE,
    |   seed |-> "4",
    |   aril |-> "0",
    |   worker |-> 1 ]
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [ mode |-> "simulate",
    |   depth |-> 3,
    |   traces |-> 1,
    |   deadlock |-> TRUE,
    |   seed |-> "4",
    |   aril |-> "0",
    |   worker |-> 1 ]
    | [ mode |-> "simulate",
    |   depth |-> 3,
    |   traces |-> 1,
    |   deadlock |-> TRUE,
    |   seed |-> "4",
    |   aril |-> "0",
    |   worker |-> 1 ]
    | [ mode |-> "simulate",
    |   depth |-> 3,
    |   traces |-> 1,
    |   deadlock |-> TRUE,
    |   seed |-> "4",
    |   aril |-> "0",
    |   worker |-> 1 ]
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
---*)
