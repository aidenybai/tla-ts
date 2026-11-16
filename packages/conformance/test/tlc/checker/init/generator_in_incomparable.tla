(*---
description: With another variable still unassigned, membership of an integer in a set of strings fails in the set's member test.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_in
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE generator_in_incomparable ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x = 1 /\ x \in {"a"} /\ y = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of string "a" with non-string:
    1
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 13, column 9 to line 13, column 37 in generator_in_incomparable
    1. Line 13, column 9 to line 13, column 28 in generator_in_incomparable
    2. Line 13, column 9 to line 13, column 13 in generator_in_incomparable
    3. Line 13, column 18 to line 13, column 28 in generator_in_incomparable
    4. Line 13, column 24 to line 13, column 28 in generator_in_incomparable


    Reason:
    Attempted to check equality of string "a" with non-string:
    1
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
