(*---
description: With only an initial state violating, CounterExample has one state and no action.
ref: tlc2/module/TLCExt.java#error
features:
  - TLCExt
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
---*)
---- MODULE counterexample_init_violation ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x > 0
Post == PrintT(CounterExample)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
    | [action |-> {}, state |-> {<<1, [x |-> 0]>>}]
---*)
