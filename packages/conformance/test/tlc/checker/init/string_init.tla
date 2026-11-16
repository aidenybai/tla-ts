(*---
description: A string as the whole Init isn't an operator application, so TLC says the relation isn't Boolean.
ref: tlc2/tool/impl/Tool.java#getInitStates
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE string_init ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == "a"
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 The init state relation is not a boolean expression.
    line 13, col 9 to line 13, col 11 of module string_init
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 11 in string_init
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
