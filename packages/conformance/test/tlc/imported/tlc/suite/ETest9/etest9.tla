(*---
description: Ported from TLC's ETest9.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest9.java
features:
  - tlc-suite
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
--------------- MODULE etest9  -------------

\* Test that TLC doesn't accept x \in Nat if x not a number

EXTENDS TLC, Naturals

VARIABLE x

Init == /\ x = "a"
        /\ Print("Should report error here", TRUE)
        /\ Print(x \in Nat, TRUE)

Next == /\ x'=x
        /\ Print("Test failed--error not reported", TRUE)
=========================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    | "Should report error here"  TRUE
    1000:1 
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    | "Should report error here"  TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 21, column 33 in etest9
    1. Line 19, column 12 to line 19, column 18 in etest9
    2. Line 21, column 12 to line 21, column 33 in etest9
    3. Line 21, column 18 to line 21, column 26 in etest9
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
