(*---
description: A FALSE Assert while computing successors is the one case with the assertion exit, 14; elsewhere it exits as an evaluation error.
ref: tlc2/tool/Worker.java#run
features:
  - TLC
flags:
  - expression
contexts:
  - next
outcome: assertion-failure
---*)
---- MODULE assert_false_in_next ----
EXTENDS TLC, Naturals
Test == Assert(FALSE, "boom")
====

(*--- recorded
all:
  exit: 14
  transcript: |-
    2132:1 The first argument of Assert evaluated to FALSE; the second argument was:
    "boom"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in assert_false_in_next
    1. Line 17, column 30 to line 17, column 33 in assert_false_in_next
    2. Line 14, column 9 to line 14, column 29 in assert_false_in_next
---*)
