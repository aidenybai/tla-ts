(*---
description: A postcondition after an initial violation in simulation sees that state through CounterExample.
ref: tlc2/tool/Simulator.java#simulate
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE postcondition_counterexample_initial ----
EXTENDS Naturals, TLC, TLCExt
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x = 1
Post == PrintT(CounterExample)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
    | [action |-> {}, state |-> {<<1, [x |-> 0]>>}]
---*)
