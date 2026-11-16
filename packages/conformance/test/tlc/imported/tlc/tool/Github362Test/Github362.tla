(*---
description: Ported from TLC's Github362Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github362Test.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github362.tla
  - -deadlock
includes:
  - Github362B.tla
---*)
---- CONFIG Github362 ----
INIT Init
NEXT Next
PROPERTY Correct
CONSTANT overloadedConst = 4711
====

---- MODULE Github362 ----

EXTENDS TLC

CONSTANT overloadedConst

VARIABLES overloadedName

\* Github362B.tla contains the definition "overloadedName == x".  It is
\* unrelated to the variable "overloadedName" defined above.
Abstract == INSTANCE Github362B WITH
    x <- "x",
    C <- 42

Init ==
    /\ overloadedName = "fizzbuzz"
    /\ overloadedConst = 4711
    /\ Print(<<"Evaluated initial state in A; overloadedName is: ", overloadedName>>, TRUE)        \* fizzbuzz
    /\ Print(<<"From A's perspective, B's overloadedName is: ", Abstract!overloadedName>>, TRUE)   \* x
    /\ Print(<<"Evaluated initial state in A; overloadedConst is: ", overloadedConst>>, TRUE)      \* 4711
    /\ Print(<<"From A's perspective, B's overloadedConst is: ", Abstract!overloadedConst>>, TRUE) \* 42

Next == UNCHANGED overloadedName

Correct == Abstract!Spec

==================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<"Evaluated initial state in A; overloadedName is: ", "fizzbuzz">>  TRUE
    | <<"From A's perspective, B's overloadedName is: ", "x">>  TRUE
    | <<"Evaluated initial state in A; overloadedConst is: ", 4711>>  TRUE
    | <<"From A's perspective, B's overloadedConst is: ", 42>>  TRUE
    | <<"Evaluating initial state in B; overloadedName is ", "x">>  TRUE
    | <<"Evaluating initial state in B; overloadedConst is ", 42>>  TRUE
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
