(*---
description: A POSTCONDITION is evaluated after an evaluation error in Next.
ref: tlc2/tool/Worker.java#doPostCheckAssumption
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE after_next_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 \div x
Post == PrintT(<<"post", TLCGet("level")>>)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    | <<"post", 0>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 21 in after_next_error
    1. Line 14, column 14 to line 14, column 21 in after_next_error
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
