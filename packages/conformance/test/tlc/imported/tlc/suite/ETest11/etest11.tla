(*---
description: Ported from TLC's ETest11.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest11.java
features:
  - tlc-suite
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
--------------- MODULE etest11  -------------

\* Test that TLC doesn't accept x \in STRING if x not a string

EXTENDS TLC

VARIABLE x

Init == /\ x = 1
        /\ Print("Should report error here", TRUE)
        /\ Print(x \in STRING, TRUE)

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
    1
    is an element of STRING.
    | "Should report error here"  TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 21, column 36 in etest11
    1. Line 19, column 12 to line 19, column 16 in etest11
    2. Line 21, column 12 to line 21, column 36 in etest11
    3. Line 21, column 18 to line 21, column 29 in etest11
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
