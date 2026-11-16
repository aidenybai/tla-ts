(*---
description: A false POSTCONDITION after -continue violations is reported, and it alone sets the exit status, since -continue records no violation.
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
args:
  - -continue
---*)
---- MODULE postcondition_false_after_violations ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = IF x < 2 THEN x + 1 ELSE x
Inv == x = 0
Post == TLCGet("level") = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 17, col 9 to line 17, col 39 of module postcondition_false_after_violations>
    x = 1
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 17, col 9 to line 17, col 39 of module postcondition_false_after_violations>
    x = 1
    2217:4 3: <Next line 17, col 9 to line 17, col 39 of module postcondition_false_after_violations>
    x = 2
    2404:1 Postcondition Post at line 19, col 9 to line 19, col 27 of module postcondition_false_after_violations is false.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
