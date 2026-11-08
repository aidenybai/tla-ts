(*---
description: Ported from TLC's Github179bTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github179bTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |-
  INIT
  Init
  NEXT
  Next
args:
  - -deadlock
---*)
---- MODULE Github179b ----
EXTENDS TLC, Naturals

VARIABLE v

Max(s) == { x \in s : \A y \in s : x >= y}

sillyExpr == 
{s \in SUBSET {1,2,3,4} : \A x \in s : IF x = Max(s) THEN TRUE ELSE (x+1) \in s}
----

Init ==
Print(sillyExpr, FALSE)/\v = 0
----
Next ==
FALSE/\ v'= v
----
=============================================================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.Print(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {1}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 27, column 1 to line 27, column 30 in Github179b
    1. Line 27, column 1 to line 27, column 23 in Github179b
    2. Line 23, column 27 to line 23, column 79 in Github179b
    3. Line 23, column 40 to line 23, column 79 in Github179b
    4. Line 23, column 43 to line 23, column 52 in Github179b
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
