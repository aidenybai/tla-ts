(*---
description: CounterExample after an initial violation in model checking holds that state.
ref: tlc2/tool/Worker.java#doPostCheckAssumption
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
---*)
---- MODULE counterexample_initial ----
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
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
    | [action |-> {}, state |-> {<<1, [x |-> 0]>>}]
---*)
