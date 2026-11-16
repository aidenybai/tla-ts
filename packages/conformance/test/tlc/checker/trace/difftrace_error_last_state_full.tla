(*---
description: -difftrace with an evaluation error in Next prints the last state in full, since it has no successor state to compare.
ref: tlc2/tool/TLCTrace.java#printTrace
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -difftrace
---*)
---- MODULE difftrace_error_last_state_full ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = x + 1 /\ y' = 1 \div (2 - x)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 41 of module difftrace_error_last_state_full>
    /\ x = 1
    2217:4 3: <Next line 15, col 9 to line 15, col 41 of module difftrace_error_last_state_full>
    /\ x = 2
    /\ y = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 41 in difftrace_error_last_state_full
    1. Line 15, column 9 to line 15, column 18 in difftrace_error_last_state_full
    2. Line 15, column 23 to line 15, column 41 in difftrace_error_last_state_full
    3. Line 15, column 28 to line 15, column 41 in difftrace_error_last_state_full
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
