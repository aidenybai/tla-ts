(*---
description: A trace of one state isn't worth a trace spec, so TLC writes only the trace's .bin.
ref: tlc2/TraceExplorationSpec.java#generate
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generateSpecTE
  - -teSpecOutDir
  - te_out.tla
files:
  - te_out.tla
  - te_out.bin
---*)
---- MODULE single_state_trace_writes_only_bin ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x > 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
  files:
    te_out.tla: null
    te_out.bin: |-
      values: 1
      [vars |-> {"x"}, counterexample |-> [state |-> {<<1, [x |-> 0]>>}, action |-> {}]]
      strings:
      "vars" loc -1
      "x" loc 0
      "counterexample" loc -1
      "state" loc -1
      "action" loc -1
---*)
