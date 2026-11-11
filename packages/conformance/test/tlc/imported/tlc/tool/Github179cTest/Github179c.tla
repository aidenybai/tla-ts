(*---
description: Ported from TLC's Github179cTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github179cTest.java
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
---- MODULE Github179c ----
EXTENDS TLC, Naturals

VARIABLE v

Max(s) == { x \in s : \A y \in s : x >= y}

sillyExpr == 
{s \in SUBSET {1,2,3,4} : 
          \A x \in s : IF x = Max(s) 
                       THEN TRUE 
                       ELSE (x+1) \in s}

Init == v = 0

Next == PrintT(sillyExpr) = FALSE /\ v'= v
=====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {1}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    v = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 30, column 9 to line 30, column 42 in Github179c
    1. Line 30, column 9 to line 30, column 33 in Github179c
    2. Line 30, column 9 to line 30, column 25 in Github179c
    3. Line 24, column 11 to line 26, column 39 in Github179c
    4. Line 24, column 24 to line 26, column 39 in Github179c
    5. Line 24, column 27 to line 24, column 36 in Github179c
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
