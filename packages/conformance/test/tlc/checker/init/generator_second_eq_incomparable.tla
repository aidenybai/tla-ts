(*---
description: With another variable still unassigned, a second x = e of incomparable values fails in lval.equals.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_eq
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE generator_second_eq_incomparable ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x = 1 /\ x = "a" /\ y = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in generator_second_eq_incomparable
    1. Line 13, column 9 to line 13, column 24 in generator_second_eq_incomparable
    2. Line 13, column 9 to line 13, column 13 in generator_second_eq_incomparable
    3. Line 13, column 18 to line 13, column 24 in generator_second_eq_incomparable
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
