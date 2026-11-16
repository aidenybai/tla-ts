(*---
description: A guard x \in {0} evaluated with x a string compares across kinds, which fails with the comparison error and the behavior.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE membership_across_kinds_fails ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = IF x \in {0} THEN "a" ELSE 0
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
    : Attempted to check equality of integer 0 with non-integer:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 41 of module membership_across_kinds_fails>
    x = "a"
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 13, column 9 to line 13, column 41 in membership_across_kinds_fails
    1. Line 13, column 14 to line 13, column 41 in membership_across_kinds_fails
    2. Line 13, column 17 to line 13, column 25 in membership_across_kinds_fails
    3. Line 13, column 23 to line 13, column 25 in membership_across_kinds_fails


    Reason:
    Attempted to check equality of integer 0 with non-integer:
    "a"
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
