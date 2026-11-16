(*---
description: A property defined as a constant non-Boolean is checked as an invariant, so it fails at the first state.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY I
---*)
---- MODULE property_constant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x
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
    0. Line 12, column 9 to line 12, column 13 in property_constant
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
