(*---
description: TLCGet("action") in simulation locates the action in the spec.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
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
---- MODULE simulate_action_location ----
EXTENDS TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == PrintT(TLCGet("action").location)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    | [ beginLine |-> 20,
    |   beginColumn |-> 9,
    |   endLine |-> 20,
    |   endColumn |-> 13,
    |   module |-> "simulate_action_location" ]
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [ beginLine |-> 21,
    |   beginColumn |-> 9,
    |   endLine |-> 21,
    |   endColumn |-> 24,
    |   module |-> "simulate_action_location" ]
    | [ beginLine |-> 21,
    |   beginColumn |-> 9,
    |   endLine |-> 21,
    |   endColumn |-> 24,
    |   module |-> "simulate_action_location" ]
    | [ beginLine |-> 21,
    |   beginColumn |-> 9,
    |   endLine |-> 21,
    |   endColumn |-> 24,
    |   module |-> "simulate_action_location" ]
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
---*)
