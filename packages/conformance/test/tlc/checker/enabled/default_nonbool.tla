(*---
description: ENABLED of a non-Boolean built-in has the expected-Boolean message.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE default_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED (x' = 1 /\ {1}))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2247:0 In computing ENABLED, TLC expected a boolean expression,
    but instead found {1}.
    line 15, col 34 to line 15, col 36 of module default_nonbool
    | While working on the initial state:
    | x = 0
    2247:0 In computing ENABLED, TLC expected a boolean expression,
    but instead found {1}.
    line 15, col 34 to line 15, col 36 of module default_nonbool
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in default_nonbool
    1. Line 15, column 8 to line 15, column 38 in default_nonbool
    2. Line 15, column 15 to line 15, column 37 in default_nonbool
    3. Line 15, column 24 to line 15, column 36 in default_nonbool
    4. Line 15, column 24 to line 15, column 29 in default_nonbool
    5. Line 15, column 34 to line 15, column 36 in default_nonbool
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
