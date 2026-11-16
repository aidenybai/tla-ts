(*---
description: A long tuple in a trace wraps with leading indentation.
ref: tlc2/value/Values.java#ppr
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE large_tuple_wraps ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = [i \in 1..40 |-> i * 1000]
Inv == TLCGet("level") < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 39 of module large_tuple_wraps>
    x = << 1000,
       2000,
       3000,
       4000,
       5000,
       6000,
       7000,
       8000,
       9000,
       10000,
       11000,
       12000,
       13000,
       14000,
       15000,
       16000,
       17000,
       18000,
       19000,
       20000,
       21000,
       22000,
       23000,
       24000,
       25000,
       26000,
       27000,
       28000,
       29000,
       30000,
       31000,
       32000,
       33000,
       34000,
       35000,
       36000,
       37000,
       38000,
       39000,
       40000 >>
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
