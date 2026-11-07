(*---
description: A -postCondition doesn't replace a safety violation's exit status.
ref: tlc2/tool/ModelChecker.java#modelCheck
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -postCondition
  - cli_post_fixture!Fail
includes:
  - cli_post_fixture.tla
---*)
---- MODULE skipped_after_violation ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x = 0
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
    2217:4 2: <Next line 19, col 9 to line 19, col 24 of module skipped_after_violation>
    x = 1
    2404:1 Postcondition Fail at line 4, col 9 to line 4, col 37 of module cli_post_fixture is false.
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
