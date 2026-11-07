(*---
description: ENABLED of action composition has the action composition message.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE cdot_body ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED ((x' = 1) \cdot (x' = 1)))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 The current version of TLC does not support action composition.  An incomplete implementation can be enabled via the tlc2.tool.impl.Tool.cdot=true java property.
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in cdot_body
    1. Line 15, column 8 to line 15, column 48 in cdot_body
    2. Line 15, column 15 to line 15, column 47 in cdot_body
    3. Line 15, column 24 to line 15, column 46 in cdot_body
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
