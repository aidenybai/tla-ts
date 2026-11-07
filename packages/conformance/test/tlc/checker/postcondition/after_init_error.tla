(*---
description: A POSTCONDITION is not evaluated after an evaluation error in Init.
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE after_init_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 1 \div 0
Next == x' = x
Post == PrintT(<<"post", TLCGet("level")>>)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 20 in after_init_error
    1. Line 13, column 13 to line 13, column 20 in after_init_error
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
