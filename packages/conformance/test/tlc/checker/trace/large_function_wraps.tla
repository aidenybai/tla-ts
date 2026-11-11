(*---
description: A function with a non-sequence domain prints with @@ pairs that wrap.
ref: tlc2/value/Values.java#ppr
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE large_function_wraps ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = [i \in 100000..100020 |-> i]
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
    2217:4 2: <Next line 14, col 9 to line 14, col 41 of module large_function_wraps>
    x = ( 100000 :> 100000 @@
      100001 :> 100001 @@
      100002 :> 100002 @@
      100003 :> 100003 @@
      100004 :> 100004 @@
      100005 :> 100005 @@
      100006 :> 100006 @@
      100007 :> 100007 @@
      100008 :> 100008 @@
      100009 :> 100009 @@
      100010 :> 100010 @@
      100011 :> 100011 @@
      100012 :> 100012 @@
      100013 :> 100013 @@
      100014 :> 100014 @@
      100015 :> 100015 @@
      100016 :> 100016 @@
      100017 :> 100017 @@
      100018 :> 100018 @@
      100019 :> 100019 @@
      100020 :> 100020 )
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
