(*---
description: Ported from TLC's Github179aTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github179aTest.java
features:
  - tlc-regression
outcome: assumption-violation
config: |-
  INIT
  Init
  NEXT
  Next
args:
  - -deadlock
---*)
---- MODULE Github179a ----
EXTENDS TLC, Naturals

VARIABLE v

Max(s) == { x \in s : \A y \in s : x >= y}

(* Attempted to check equality of integer 1 with non-integer: {1} *)
sillyExpr == 
   {s \in SUBSET {1,2,3} : 
               \A x \in s : IF x = Max(s) 
                            THEN TRUE
                            ELSE (x+1) \in s}
----

ASSUME PrintT(<<"$!@$!@$!@$!@$!", sillyExpr>>)
----

Init ==
FALSE/\v = 0
----
Next ==
FALSE/\ v'= v
----
=============================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 30, col 8 to line 30, col 46 of module Github179a failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {1}
---*)
