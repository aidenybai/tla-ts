(*---
description: An alias can read Trace from TLCExt, the prefix of the behavior.
ref: tlc2/tool/impl/Tool.java#evalAlias
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
---*)
---- MODULE alias_with_trace_operator ----
EXTENDS Naturals, TLC, TLCExt
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A == [n |-> Trace]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    n = <<[x |-> 0]>>
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module alias_with_trace_operator>
    n = <<[x |-> 0], [x |-> 1]>>
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module alias_with_trace_operator>
    n = <<[x |-> 0], [x |-> 1], [x |-> 2]>>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
