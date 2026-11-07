(*---
description: A failed Assert in an invariant on an initial state reports Assert's message.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE assert_in_invariant_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == Assert(x > 0, "bad")
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "bad"
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "bad"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in assert_in_invariant_initial
    1. Line 15, column 8 to line 15, column 27 in assert_in_invariant_initial
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
