(*---
description: A postcondition is evaluated after an initial violation in simulation, though the checker's error code wins.
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
---- MODULE invariant_initial_postcondition ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x = 1
Post == PrintT(<<"post", TLCGet("level")>>)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
    | <<"post", 0>>
---*)
