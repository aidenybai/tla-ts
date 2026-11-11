(*---
description: Ported from TLC's ETest15.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest15.java
features:
  - tlc-suite
outcome: assumption-violation
config: ""
---*)
----------------------  MODULE etest15 -----------------------------
\* Test that TLC distinguishes <<x>> from x in function expressions.

EXTENDS Naturals

S == {<<y>> : y \in {1, 2, 3, 4}}

ASSUME  [<<y>> \in S |-> y+1][2] = [<<y>> \in S |-> y+1][2] 
  
=====================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 16, col 9 to line 16, col 59 of module etest15 failed.
    Attempted to compare integer 2 with non-integer:
    <<3>>
---*)
