(*---
description: Ported from TLC's ETest10.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest10.java
features:
  - tlc-suite
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
--------------- MODULE etest10  -------------

\* Test that TLC doesn't accept x \in Int if x not a number

EXTENDS TLC, Integers

VARIABLE x

Init == /\ x = "a"
        /\ Print("Should report error here", TRUE)
        /\ Print(x \in Int, TRUE)

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
    is an element of Int.
    | "Should report error here"  TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 21, column 33 in etest10
    1. Line 19, column 12 to line 19, column 18 in etest10
    2. Line 21, column 12 to line 21, column 33 in etest10
    3. Line 21, column 18 to line 21, column 26 in etest10
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
