(*---
description: Assert's message can be any value and it prints with quotes when a string.
ref: tlc2/module/TLC.java#Assert
outcome: assertion-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE assert_string_only_message ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == Assert(FALSE, <<"a", 1>>) /\ x' = 1
====

(*--- recorded
all:
  exit: 14
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2132:1 The first argument of Assert evaluated to FALSE; the second argument was:
    <<"a", 1>>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 43 in assert_string_only_message
    1. Line 13, column 9 to line 13, column 33 in assert_string_only_message
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
