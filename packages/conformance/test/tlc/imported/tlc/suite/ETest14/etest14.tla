(*---
description: Ported from TLC's ETest14.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest14.java
features:
  - tlc-suite
outcome: assumption-violation
config: ""
---*)
----------------------  MODULE etest14 -----------------------------

\* Test of CHOOSEing element of empty set.
ASSUME
  /\ (CHOOSE y \in {} : TRUE) = (CHOOSE y \in {} : TRUE)
=====================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 3 to line 13, col 56 of module etest14 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 13, col 7 to line 13, col 28 of module etest14
---*)
