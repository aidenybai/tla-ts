(*---
description: Ported from TLC's Github525Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github525Test.java
features:
  - tlc-regression
outcome: tlc-error
config: |
  SPECIFICATION
      Spec
  \*INVARIANT
  PROPERTY
      Invariant
   \*   Prop
args:
  - -deadlock
---*)
------ MODULE Github525 ------
EXTENDS Naturals

VARIABLE x

Init ==
    /\  x = 1
    
Next ==
    /\  x < 5
    /\  x' = x + 1

Spec ==
    /\  Init
    /\ [][Next]_x
    \* Weak fairness starts with a box
    /\ []<>(ENABLED <<Next>>_x => []<><<Next>>_x)
    /\ WF_x(Next) 
    /\  ~<>~(x < 3) \* This one is not caught.
    \*/\ []FALSE
    /\ [](x < 3)
    
Invariant ==
    x < 4

Prop == [][x' \in {1, 2}]_x

THEOREM Spec => []Invariant

====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 37, col 11 to line 37, col 15 of module Github525
---*)
