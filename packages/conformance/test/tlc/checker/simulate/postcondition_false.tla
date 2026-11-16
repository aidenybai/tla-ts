(*---
description: A false postcondition after simulation reports the failure.
ref: tlc2/tool/Simulator.java#simulate
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE postcondition_false ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Post == TLCGet("level") = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2404:1 Postcondition Post at line 20, col 9 to line 20, col 27 of module postcondition_false is false.
    2209:0 Progress(1) at <date>: 6 states generated, -1 distinct states found, -1 states left on queue.
---*)
