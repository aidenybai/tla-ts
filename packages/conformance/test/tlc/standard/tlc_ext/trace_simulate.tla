(*---
description: Trace in simulation is the current behavior, with each state's action.
ref: tlc2/module/TLCExt.java#getTrace
features:
  - TLCExt
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
---- MODULE trace_simulate ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == PrintT(Trace)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    | <<[x |-> 0, _action |-> [name |-> "Init", location |-> [beginLine |-> 20, beginColumn |-> 9, endLine |-> 20, endColumn |-> 13, module |-> "trace_simulate"]]]>>
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<[x |-> 0, _action |-> [name |-> "Init", location |-> [beginLine |-> 20, beginColumn |-> 9, endLine |-> 20, endColumn |-> 13, module |-> "trace_simulate"]]], [x |-> 1, _action |-> [name |-> "Next", location |-> [beginLine |-> 21, beginColumn |-> 9, endLine |-> 21, endColumn |-> 24, module |-> "trace_simulate"]]]>>
    | <<[x |-> 0, _action |-> [name |-> "Init", location |-> [beginLine |-> 20, beginColumn |-> 9, endLine |-> 20, endColumn |-> 13, module |-> "trace_simulate"]]], [x |-> 1, _action |-> [name |-> "Next", location |-> [beginLine |-> 21, beginColumn |-> 9, endLine |-> 21, endColumn |-> 24, module |-> "trace_simulate"]]], [x |-> 2, _action |-> [name |-> "Next", location |-> [beginLine |-> 21, beginColumn |-> 9, endLine |-> 21, endColumn |-> 24, module |-> "trace_simulate"]]]>>
    | <<[x |-> 0, _action |-> [name |-> "Init", location |-> [beginLine |-> 20, beginColumn |-> 9, endLine |-> 20, endColumn |-> 13, module |-> "trace_simulate"]]], [x |-> 1, _action |-> [name |-> "Next", location |-> [beginLine |-> 21, beginColumn |-> 9, endLine |-> 21, endColumn |-> 24, module |-> "trace_simulate"]]], [x |-> 2, _action |-> [name |-> "Next", location |-> [beginLine |-> 21, beginColumn |-> 9, endLine |-> 21, endColumn |-> 24, module |-> "trace_simulate"]]], [x |-> 0, _action |-> [name |-> "Next", location |-> [beginLine |-> 21, beginColumn |-> 9, endLine |-> 21, endColumn |-> 24, module |-> "trace_simulate"]]]>>
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
---*)
