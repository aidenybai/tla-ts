(*---
description: With two variables unassigned, the message uses the plural and names them.
ref: tlc2/module/TLCExt.java#getTrace
features:
  - TLCExt
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE trace_init_before_assignment_plural ----
EXTENDS TLCExt, TLC, Sequences
VARIABLES x, y
Init == Trace = <<>> /\ x = 0 /\ y = 0
Next == UNCHANGED <<x, y>>
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:0 In evaluating TLCExt!Trace, the state is not completely specified yet (variables x, y undefined).
    1000:0 In evaluating TLCExt!Trace, the state is not completely specified yet (variables x, y undefined).
    1000:0 In evaluating TLCExt!Trace, the state is not completely specified yet (variables x, y undefined).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 38 in trace_init_before_assignment_plural
    1. Line 14, column 9 to line 14, column 29 in trace_init_before_assignment_plural
    2. Line 14, column 9 to line 14, column 20 in trace_init_before_assignment_plural
    3. Line 14, column 9 to line 14, column 13 in trace_init_before_assignment_plural
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
