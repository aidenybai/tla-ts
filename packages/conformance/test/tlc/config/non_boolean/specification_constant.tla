(*---
description: SPECIFICATION naming a constant non-Boolean takes it as the initial predicate, which fails when the initial states are computed.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
outcome: evaluation-failure
config: |
  SPECIFICATION I
---*)
---- MODULE specification_constant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
I == 3
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 The init state relation is not a boolean expression.
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 6 to line 13, column 6 in specification_constant
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
