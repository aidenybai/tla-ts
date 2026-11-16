(*---
description: Ported from TLC's Test216.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test216.java
features:
  - tlc-suite
outcome: success
config: |-
  SPECIFICATION   Spec1 \* Spec
  CONSTANT C=6
  INVARIANT Inv Inv2
  PROPERTIES Prop1 Prop2 Prop3 Prop4 Prop5
includes:
  - test216a.tla
  - test216b.tla
  - test216c.tla
---*)
---------------------------- MODULE test216 ------------------------
EXTENDS TLC, Naturals

INSTANCE test216a WITH D <- 42
Foo == INSTANCE test216a WITH D <- 43
FooG == INSTANCE test216a WITH D <- 42
VARIABLE x
CONSTANT C

THEOREM Thm1 == x \in 0..C
 
THEOREM Thm1Prime == x' \in 0..C

THEOREM Thm1a == 1+1=2
Bar == x \in 0..C
Init == Bar \/ Thm1!: \/ (Thm1 /\ ENABLED Thm1Prime!:)
Next == x'=(x+1)%C  /\  Thm1!: 
             /\ Thm1Prime!: /\ Thm1 /\ Thm1Prime
Spec == /\ Init 
        /\ [][Next]_x
        /\ WF_x(Next)




Inv == Thm1
Inv2 == Thm1!<< \in Thm1!>>

THEOREM Thm1b == Spec => /\ []Inv 
                         /\  []<>(x=0)

Spec1 == Thm1b!1
\* need to build two tests, since there are two specs

THEOREM Thm1c == [][Next]_x
Spec2 == Init /\ Thm1c \* Doesn't work

Thm1d == []<>(x=0)
Prop3 == Thm1d

Prop1 == Thm1b!2!1
Prop2 == Thm1b!2!2

ASSUME Thm2
ASSUME ~ Foo!Thm2
ASSUME ~Foo!Thm3
ASSUME ~Foo!I!Thm3
ASSUME  FooG!Thm2
ASSUME FooG!Thm3 
ASSUME FooG!I!Thm3
ASSUME Thm2!:
ASSUME ~ Foo!Thm2!:
ASSUME Thm2!1 = 42
ASSUME Foo!Thm2!1 = 43

THEOREM Thm3!:
THEOREM ~ Foo!Thm3!:
ASSUME Foo!Thm3!2!2 = 42
ASSUME Foo!I!Thm3!2!2 = 42
ASSUME I!Thm3!2!2 = 42
ASSUME Thm3!2!2 = 42


J == INSTANCE test216c
Prop4 == J!ThmC!1 /\ J!ThmC!2 /\ J!ThmC2!:

Thm1aDef == Thm1a

INSTANCE test216c
ThmC3Def == ThmC3
Prop5 == ThmC!1 /\ ThmC!2   /\ ThmC3!: /\ Thm1aDef /\ ThmC3Def
====================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2191:0 Finished computing initial states: 21 states generated, with 7 of them distinct at <date>.
    2192:0 Checking temporal properties for the complete state space with 7 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 8.0E-18
    2199:0 28 states generated, 7 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
