(*---
description: An invariant defined as a constant non-Boolean is still an OpDefNode when the file is processed, so the failure appears at the first state rather than as a config error.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT I
---*)
---- MODULE invariant_constant ----
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
    2102:1 While working on the initial state:
    x = 0
    2215:0 TLC expected a boolean value, but did not find one. 3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in invariant_constant
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
