(*---
description: A non-Boolean built-in such as a set enumeration in the generator path reports the value it found.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE set_conjunct_unassigned ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x = 1 /\ {1} /\ y = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 In computing initial states, TLC expected a boolean expression,
    but instead found {1}.
    line 13, col 18 to line 13, col 20 of module set_conjunct_unassigned
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 29 in set_conjunct_unassigned
    1. Line 13, column 9 to line 13, column 20 in set_conjunct_unassigned
    2. Line 13, column 9 to line 13, column 13 in set_conjunct_unassigned
    3. Line 13, column 18 to line 13, column 20 in set_conjunct_unassigned
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
