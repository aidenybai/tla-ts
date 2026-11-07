(*---
description: An invariant violated by an initial state prints the alias of the state in simulation.
ref: tlc2/tool/Simulator.java#simulate
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
  - "5"
---*)
---- MODULE invariant_initial_alias ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x = 1
A == [y |-> x + 1]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2107:1 Invariant Inv is violated by the initial state:
    y = 1
---*)
