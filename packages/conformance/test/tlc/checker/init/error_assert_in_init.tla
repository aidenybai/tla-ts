(*---
description: A failed Assert while computing initial states prints its message twice, once for the first pass and once for the replay, and exits with the initial-state failure status rather than the assertion status.
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_assert_in_init ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = 1 /\ Assert(FALSE, "init assert")
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "init assert"
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "init assert"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 45 in error_assert_in_init
    1. Line 13, column 9 to line 13, column 13 in error_assert_in_init
    2. Line 13, column 18 to line 13, column 45 in error_assert_in_init
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
