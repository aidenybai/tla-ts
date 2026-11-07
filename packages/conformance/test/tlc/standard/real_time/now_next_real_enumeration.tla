(*---
description: Choosing now' from a filter over Real fails while enumerating the string.
ref: tla2sany/StandardModules/RealTime.tla#RTnow
features:
  - RealTime
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE now_next_real_enumeration ----
EXTENDS RealTime
VARIABLE x
Init == x = 0 /\ now = 0
Next == x' = x /\ now' \in {r \in Real : r > now}
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to enumerate { x \in S : p(x) } when S:
    "Reals"
    is not enumerable
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ now = 0
    /\ x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 49 in now_next_real_enumeration
    1. Line 15, column 9 to line 15, column 14 in now_next_real_enumeration
    2. Line 15, column 19 to line 15, column 49 in now_next_real_enumeration
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
