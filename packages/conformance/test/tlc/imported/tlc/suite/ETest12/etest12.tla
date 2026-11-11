(*---
description: Ported from TLC's ETest12.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest12.java
features:
  - tlc-suite
outcome: assumption-violation
config: ""
---*)
-------------------------- MODULE etest12 --------------------------------
EXTENDS Naturals, TLC, FiniteSets
\* Test of error reporting when computing Cardinality of a huge set.

ASSUME
     IF Cardinality ([0..2 -> 1..2000]) = Cardinality ([2..4 -> 1..2000]) 
       THEN Print("Test 22 OK", TRUE)
       ELSE Assert(FALSE, "Test 22 Failed")
==========================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 14, col 6 to line 16, col 43 of module etest12 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Overflow when computing the number of elements in:
    [0..2 -> 1..2000]
---*)
