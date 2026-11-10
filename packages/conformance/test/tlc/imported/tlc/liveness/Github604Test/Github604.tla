(*---
description: Ported from TLC's Github604Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/Github604Test.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github604.tla
  - -deadlock
---*)
------ MODULE Github604 ------
EXTENDS Naturals

VARIABLE 
    \* @type: Int;  \* Apalache type annotation
    x

Init == x = 0

Next == x' \in 0..3

Spec == Init /\ [][Next]_x \* /\ WF_x(Next)

-----------------------------------------------

USE DEF Init, Next, Spec

Prop01 == <>(TRUE)
THEOREM Spec => Prop01 BY DEF Prop01 

Prop02 == [](TRUE)             \* TLC checks Prop02 as part of safety checking.
THEOREM Spec => Prop02 BY DEF Prop02

Prop03 == <>[](TRUE)
THEOREM Spec => Prop03 OMITTED \* Not proved by TLAPS 1.4.5 (feels inconsistent WRT 01 & 02)

-----------------------------------------------

\* Prop04 & 05 take a different code path of TLC compared to
\* 06 & 07 despite being logically equivalent.

Prop04 == FALSE ~> TRUE
THEOREM Spec => Prop04 OMITTED \* Not proved by TLAPS 1.4.5

Prop05 == FALSE ~> FALSE
THEOREM Spec => Prop05 OMITTED \* Not proved by TLAPS 1.4.5
    
Prop06 == TRUE ~> TRUE
THEOREM Spec => Prop06 OMITTED \* Not proved by TLAPS 1.4.5

Prop07 == [](FALSE => <>TRUE)
THEOREM Spec => Prop07 OMITTED \* Not proved by TLAPS 1.4.5

Prop08 == [](FALSE => <>FALSE)
THEOREM Spec => Prop08 OMITTED \* Not proved by TLAPS 1.4.5

\* state-level

Prop09 == [](FALSE => <>(x=x))
THEOREM Spec => Prop09 OMITTED \* Not proved by TLAPS 1.4.5

Prop10 == [](FALSE => <>(x#x))
THEOREM Spec => Prop10 OMITTED \* Not proved by TLAPS 1.4.5

-----------------------------------------------

Prop11 == <>(x=x)
THEOREM Spec => Prop11 OMITTED \* Not proved by TLAPS 1.4.5
   
Prop12 == [](x=x)
THEOREM Spec => Prop12 OMITTED \* Not proved by TLAPS 1.4.5
    
Prop13 == <>[](x=x)
THEOREM Spec => Prop13 OMITTED \* Not proved by TLAPS 1.4.5

-----------------------------------------------

Prop14 == TRUE ~> []TRUE /\ (FALSE ~> []TRUE)

Prop15 == TRUE ~> <>TRUE /\ (FALSE ~> <>TRUE)

Prop16 == TRUE ~> <>[]TRUE /\ (FALSE ~> <>[]TRUE)

-----------------------------------------------

Prop17 == TRUE ~> [](x=x) /\ (FALSE ~> [](x=x))

Prop18 == TRUE ~> <>(x=x) /\ (FALSE ~> <>(x=x))

Prop19 == TRUE ~> <>[](x=x) /\ (FALSE ~> <>[](x=x))

Prop20 == (FALSE /\ (x=x)) ~> (<>[](x#x))

====

---- CONFIG Github604 ----
SPECIFICATION Spec
PROPERTY
    Prop01  \* Fixed as part of Github #604
    Prop02
    Prop03
    Prop04  \* Fixed as part of Github #604
    Prop05  \* Fixed as part of Github #604 
    Prop06
    Prop07  \* Fixed as part of Github #604
    Prop08  \* Fixed as part of Github #604
    Prop09  \* Fixed as part of Github #604
    Prop10  \* Fixed as part of Github #604
    Prop11
    Prop12
    Prop13
    Prop14 \* Fixed as part of Github #604
    Prop15 \* Fixed as part of Github #604
    Prop16 \* Fixed as part of Github #604
    Prop17 \* Fixed as part of Github #604
    Prop18 \* Fixed as part of Github #604
    Prop19 \* Fixed as part of Github #604
    Prop20
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 11 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 11 branches of temporal properties for the complete state space with 44 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.8E-18
    2199:0 17 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 3 and the 95th percentile is 3).
---*)
