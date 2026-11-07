(*---
description: A warning raised while evaluating an invariant stops the run when it is listed.
ref: tlc2/tool/impl/Tool.java#enabledUnchangedImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -messagesAsErrors
  - "2143"
---*)
---- MODULE unchanged_warning_promoted ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
A == x' = 1 /\ UNCHANGED x
Next == x' = 0
Inv == ENABLED A
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2143:0 The variable x was changed while it is specified as UNCHANGED at
    line 17, col 26 to line 17, col 26 of module unchanged_warning_promoted
    | While working on the initial state:
    | x = 0
    2143:0 The variable x was changed while it is specified as UNCHANGED at
    line 17, col 26 to line 17, col 26 of module unchanged_warning_promoted
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 13 in unchanged_warning_promoted
    1. Line 19, column 8 to line 19, column 16 in unchanged_warning_promoted
    2. Line 19, column 16 to line 19, column 16 in unchanged_warning_promoted
    3. Line 17, column 6 to line 17, column 26 in unchanged_warning_promoted
    4. Line 17, column 6 to line 17, column 11 in unchanged_warning_promoted
    5. Line 17, column 16 to line 17, column 26 in unchanged_warning_promoted
    6. Line 17, column 26 to line 17, column 26 in unchanged_warning_promoted
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
