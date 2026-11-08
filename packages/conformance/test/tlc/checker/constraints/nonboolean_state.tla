(*---
description: A non-Boolean constraint fails with the expected-value message and the state being worked on.
ref: tlc2/tool/impl/Tool.java#isInModel
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE nonboolean_state ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Con == x + 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    x = 0
    2215:0 TLC expected a boolean value, but did not find one. line 15, col 8 to line 15, col 12 of module nonboolean_state
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in nonboolean_state
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
