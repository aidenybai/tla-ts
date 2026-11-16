(*---
description: Ported from TLC's Test45.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test45.java
features:
  - tlc-suite
outcome: success
config: "  INIT

  \    Init

  \ \ 

  \  NEXT

  \    Next

  \ \ 

  \  INVARIANT Inv




  \ "
---*)
------------------------------ MODULE test45 -----------------------------
(* Test of recursive function definitions. *)

EXTENDS Naturals, TLC

VARIABLES x

Init == x = 2

Next == UNCHANGED x

f[i \in 0..5] == [j \in 0..5 |-> 
                    IF j = 0 
                      THEN [k \in 0..i |-> 
                              IF k = 0 THEN i
                                       ELSE f[i][1] + 1]
                      ELSE IF i = 0
                             THEN j
                             ELSE f[i-1][j] + 1 ]

g[i \in 0..5] == [j \in 0..i |-> 
                   IF j = 0 
                     THEN IF i = 0 THEN 0
                                   ELSE g[i-1][i-1]
                     ELSE g[i][j-1]+x]


h[i \in 0..3, j \in 0..3] == [k \in 0..3 |->
                               IF k = 0
                                 THEN IF j = 0 
                                        THEN IF i = 0 THEN 0
                                                      ELSE h[i-1,j][k] + 1
                                        ELSE h[i,j-1][k]+1
                                 ELSE h[i,j][k-1] + 1]

(* g[0][0] = 0  
   g[0][j] = j * x
   g[i][j] = j * x + g[i-1][i-1] 
           = (j + i-1) * x + g[i-2][i-2]
           = (j + i + i-1) * x  + g[i-3][i-2] 
           = ... *)

Inv == /\ IF  f[4][3] = 7
            THEN Print("Test 1 OK", TRUE)
            ELSE Assert(FALSE, "Test 1 Failed")    

       /\ IF f[4][0][2] = 6
            THEN Print("Test 2 OK", TRUE)
            ELSE Assert(FALSE, "Test 2 Failed")    

       /\ IF DOMAIN g[3] = 0..3
            THEN Print("Test 3  OK", TRUE)
            ELSE Assert(FALSE, "Test 3 Failed")

       /\ IF DOMAIN f[5][0] = 0..5
            THEN Print("Test 4 OK", TRUE)
            ELSE Assert(FALSE, "Test 4 Failed")

       /\ IF g[0][0] = 0
            THEN Print("Test 5 OK", TRUE)
            ELSE Assert(FALSE, "Test 5 Failed")

       /\ IF g[3][3] = 12
            THEN Print("Test 6 OK", TRUE)
            ELSE Assert(FALSE, "Test 6 Failed")

       /\ IF g[3][1] = 8
            THEN Print("Test 7 OK", TRUE)
            ELSE Assert(FALSE, "Test 7 Failed")

       /\ IF g[2][0] = 2
            THEN Print("Test 8 OK", TRUE)
            ELSE Assert(FALSE, "Test 8 Failed")

       /\ IF DOMAIN h[1,2] = 0..3
            THEN Print("Test 9 OK", TRUE)
            ELSE Assert(FALSE, "Test 9 Failed")

       /\ IF DOMAIN h = (0..3) \X (0..3)
            THEN Print("Test 10 OK", TRUE)
            ELSE Assert(FALSE, "Test 10 Failed")

       /\ IF h[2, 3] = [i \in 0..3 |-> i+5]
            THEN Print("Test 11 OK", TRUE)
            ELSE Assert(FALSE, "Test 11 Failed")

       /\ IF h[1, 2][3] = 6
            THEN Print("Test 12 OK", TRUE)
            ELSE Assert(FALSE, "Test 12 Failed")


=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "Test 1 OK"  TRUE
    | "Test 2 OK"  TRUE
    | "Test 3  OK"  TRUE
    | "Test 4 OK"  TRUE
    | "Test 5 OK"  TRUE
    | "Test 6 OK"  TRUE
    | "Test 7 OK"  TRUE
    | "Test 8 OK"  TRUE
    | "Test 9 OK"  TRUE
    | "Test 10 OK"  TRUE
    | "Test 11 OK"  TRUE
    | "Test 12 OK"  TRUE
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
