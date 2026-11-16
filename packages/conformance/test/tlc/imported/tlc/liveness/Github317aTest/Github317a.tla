(*---
description: Ported from TLC's Github317aTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/Github317aTest.java
features:
  - tlc-regression
outcome: tlc-error
args:
  - -config
  - Github317a.tla
  - -deadlock
---*)
-------------------------------- MODULE Github317a --------------------------------

EXTENDS Integers, Sequences, FiniteSets

CONSTANTS
ro, n1, n2, n3, n4, n5

Nodes==
{ro, n1, n2, n3, n4, n5}

root==
ro

Edges==
{{ro,n1}, {ro,n2}, {n1,n3}, {n2,n3}, {n3,n4}, {n3,n5}}

MaxNodes==
7

HasTwoElts(S) == \E a,b \in S : (a # b) /\ (S = {a,b})

ASSUME /\ \A e \in Edges : (e \subseteq Nodes) /\ HasTwoElts(e)
       /\ root \in Nodes
       /\ MaxNodes >= Cardinality(Nodes)

Nbrs(n) == {m \in Nodes : {m,n} \in Edges}

SetNbrs(S) == UNION {Nbrs(n) : n \in S}

RECURSIVE ReachableFrom(_)
ReachableFrom(S) == LET R == SetNbrs(S)
                    IN  IF R \subseteq S THEN S
                                         ELSE ReachableFrom(R \cup S)
                          
RECURSIVE DistanceFrom(_, _)
DistanceFrom(n, S) == IF n \in S THEN 0 
                                 ELSE 1 + DistanceFrom(n, S \cup SetNbrs(S))
----------------------------------------------------------------------------
(***************************************************************************)
(* More efficiently executable definitions.                                *)
(***************************************************************************)

RECURSIVE EReachableFrom(_,_)
EReachableFrom(Bdry, S) ==
   LET R == SetNbrs(Bdry) \ S                            
   IN  IF R = {} THEN S ELSE EReachableFrom(R, R\cup S)

THEOREM \A S \in SUBSET Nodes : EReachableFrom(S, {}) = ReachableFrom(S)

ASSUME ReachableFrom({root}) = Nodes

RECURSIVE EDistanceFrom(_, _, _)
EDistanceFrom(n, Bdry, S) ==
     LET R == SetNbrs(Bdry) \ S
     IN  IF n \in Bdry THEN 0 ELSE 1 + EDistanceFrom(n, R, S \cup R)
     
THEOREM \A n \in Nodes, S \in (SUBSET Nodes) \ {{}} : 
         EDistanceFrom(n, S, {}) = DistanceFrom(n, S)

Dist(n, m) == EDistanceFrom(n, {m}, {})
-----------------------------------------------------------------------------
QueuesFrom(n) == {<<n, m>> : m \in Nbrs(n)}
QueuesTo(n)  == {<<m, n>> : m \in Nbrs(n)}
Queues == UNION {QueuesFrom(n) : n \in Nodes}
NodePs == {<<n>> : n \in Nodes}

(***************************************************************************
--algorithm MinSpanningTree {
    variables msgs = [q \in Queues |-> IF q[1] = root THEN <<0>> ELSE << >>] ;
    fair process (nd \in NodePs) 
      variables depth = IF self[1] = root THEN 0 ELSE MaxNodes,
                parent = self[1], 
                acked = [n \in Nbrs(self[1]) |->  
                           IF self[1] = <<root>> THEN FALSE ELSE TRUE];           
      { a: while (TRUE) { 
\*            either {
              with (q \in {r \in QueuesTo(self[1]) : msgs[r] /= << >>}) {
                 if (Head(msgs[q]) < depth - 1) {
                    depth := Head(msgs[q]) + 1;
                    parent := q[1] ;
                    msgs := [r \in Queues |->
                              IF r = q 
                                THEN Tail(msgs[q])
                                ELSE IF r \in QueuesFrom(self[1]) \ {<<self[1], q[1]>>}
                                       THEN Append(msgs[r], depth)
                                       ELSE msgs[r] ];
                   acked := [b \in Nbrs(self[1]) |-> b /= q[1]] 
                              
                 } else { 
                     msgs[q] := Tail(msgs[q]) ;
                     if (Head(msgs[q]) =< depth+1) {acked[q[1]] := TRUE} 
                 }
               }
\*           }
         }
      }
\*    process (qu \in Queues) {
\*   }
}

 ***************************************************************************)
\* BEGIN TRANSLATION (chksum(pcal) = "702f848" /\ chksum(tla) = "c301c684")
VARIABLES msgs, depth, parent, acked

vars == << msgs, depth, parent, acked >>

ProcSet == (NodePs)

Init == (* Global variables *)
        /\ msgs = [q \in Queues |-> IF q[1] = root THEN <<0>> ELSE << >>]
        (* Process nd *)
        /\ depth = [self \in NodePs |-> IF self[1] = root THEN 0 ELSE MaxNodes]
        /\ parent = [self \in NodePs |-> self[1]]
        /\ acked = [self \in NodePs |-> [n \in Nbrs(self[1]) |->
                                           IF self[1] = <<root>> THEN FALSE ELSE TRUE]]

nd(self) == \E q \in {r \in QueuesTo(self[1]) : msgs[r] /= << >>}:
              IF Head(msgs[q]) < depth[self] - 1
                 THEN /\ depth' = [depth EXCEPT ![self] = Head(msgs[q]) + 1]
                      /\ parent' = [parent EXCEPT ![self] = q[1]]
                      /\ msgs' = [r \in Queues |->
                                   IF r = q
                                     THEN Tail(msgs[q])
                                     ELSE IF r \in QueuesFrom(self[1]) \ {<<self[1], q[1]>>}
                                            THEN Append(msgs[r], depth'[self])
                                            ELSE msgs[r] ]
                      /\ acked' = [acked EXCEPT ![self] = [b \in Nbrs(self[1]) |-> b /= q[1]]]
                 ELSE /\ msgs' = [msgs EXCEPT ![q] = Tail(msgs[q])]
                      /\ IF Head(msgs'[q]) =< depth[self]+1
                            THEN /\ acked' = [acked EXCEPT ![self][q[1]] = TRUE]
                            ELSE /\ TRUE
                                 /\ acked' = acked
                      /\ UNCHANGED << depth, parent >>

Next == (\E self \in NodePs: nd(self))

Spec == /\ Init /\ [][Next]_vars
        /\ \A self \in NodePs : WF_vars(nd(self))

\* END TRANSLATION 

TypeOK == /\ depth  \in [NodePs -> 0..MaxNodes]
          /\ parent \in [NodePs -> Nodes]
          /\ msgs \in [Queues -> Seq(0..(Cardinality(Nodes)-1))]
          
Termination == \A q \in Queues : msgs[q] = << >>

Correctness == Termination => 
                 \A n \in Nodes : 
                    /\ depth[<<n>>] = Dist(n, root)
                    /\ (n /= root) => depth[<<parent[<<n>>]>>] = depth[<<n>>] - 1

Prop ==
<>Termination
    
=============================================================================
---- CONFIG Github317a ----
CONSTANTS
ro = ro
n1 = n1
n2 = n2
n3 = n3
n4 = n4
n5 = n5

SPECIFICATION
Spec

INVARIANT
TypeOK
Correctness

PROPERTY
Prop
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2184:1 Attempted to apply Head to the empty sequence.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ msgs = ( <<ro, n1>> :> <<0>> @@
      <<ro, n2>> :> <<0>> @@
      <<n1, ro>> :> <<>> @@
      <<n1, n3>> :> <<>> @@
      <<n2, ro>> :> <<>> @@
      <<n2, n3>> :> <<>> @@
      <<n3, n1>> :> <<>> @@
      <<n3, n2>> :> <<>> @@
      <<n3, n4>> :> <<>> @@
      <<n3, n5>> :> <<>> @@
      <<n4, n3>> :> <<>> @@
      <<n5, n3>> :> <<>> )
    /\ depth = ( <<ro>> :> 0 @@
      <<n1>> :> 7 @@
      <<n2>> :> 7 @@
      <<n3>> :> 7 @@
      <<n4>> :> 7 @@
      <<n5>> :> 7 )
    /\ parent = ( <<ro>> :> ro @@
      <<n1>> :> n1 @@
      <<n2>> :> n2 @@
      <<n3>> :> n3 @@
      <<n4>> :> n4 @@
      <<n5>> :> n5 )
    /\ acked = ( <<ro>> :> (n1 :> TRUE @@ n2 :> TRUE) @@
      <<n1>> :> (ro :> TRUE @@ n3 :> TRUE) @@
      <<n2>> :> (ro :> TRUE @@ n3 :> TRUE) @@
      <<n3>> :> (n1 :> TRUE @@ n2 :> TRUE @@ n4 :> TRUE @@ n5 :> TRUE) @@
      <<n4>> :> (n3 :> TRUE) @@
      <<n5>> :> (n3 :> TRUE) )
    2217:4 2: <nd(<<n1>>) line 128, col 13 to line 144, col 54 of module Github317a>
    /\ msgs = ( <<ro, n1>> :> <<>> @@
      <<ro, n2>> :> <<0>> @@
      <<n1, ro>> :> <<>> @@
      <<n1, n3>> :> <<1>> @@
      <<n2, ro>> :> <<>> @@
      <<n2, n3>> :> <<>> @@
      <<n3, n1>> :> <<>> @@
      <<n3, n2>> :> <<>> @@
      <<n3, n4>> :> <<>> @@
      <<n3, n5>> :> <<>> @@
      <<n4, n3>> :> <<>> @@
      <<n5, n3>> :> <<>> )
    /\ depth = ( <<ro>> :> 0 @@
      <<n1>> :> 1 @@
      <<n2>> :> 7 @@
      <<n3>> :> 7 @@
      <<n4>> :> 7 @@
      <<n5>> :> 7 )
    /\ parent = ( <<ro>> :> ro @@
      <<n1>> :> ro @@
      <<n2>> :> n2 @@
      <<n3>> :> n3 @@
      <<n4>> :> n4 @@
      <<n5>> :> n5 )
    /\ acked = ( <<ro>> :> (n1 :> TRUE @@ n2 :> TRUE) @@
      <<n1>> :> (ro :> FALSE @@ n3 :> TRUE) @@
      <<n2>> :> (ro :> TRUE @@ n3 :> TRUE) @@
      <<n3>> :> (n1 :> TRUE @@ n2 :> TRUE @@ n4 :> TRUE @@ n5 :> TRUE) @@
      <<n4>> :> (n3 :> TRUE) @@
      <<n5>> :> (n3 :> TRUE) )
    2217:4 3: <nd(<<n2>>) line 128, col 13 to line 144, col 54 of module Github317a>
    /\ msgs = ( <<ro, n1>> :> <<>> @@
      <<ro, n2>> :> <<>> @@
      <<n1, ro>> :> <<>> @@
      <<n1, n3>> :> <<1>> @@
      <<n2, ro>> :> <<>> @@
      <<n2, n3>> :> <<1>> @@
      <<n3, n1>> :> <<>> @@
      <<n3, n2>> :> <<>> @@
      <<n3, n4>> :> <<>> @@
      <<n3, n5>> :> <<>> @@
      <<n4, n3>> :> <<>> @@
      <<n5, n3>> :> <<>> )
    /\ depth = ( <<ro>> :> 0 @@
      <<n1>> :> 1 @@
      <<n2>> :> 1 @@
      <<n3>> :> 7 @@
      <<n4>> :> 7 @@
      <<n5>> :> 7 )
    /\ parent = ( <<ro>> :> ro @@
      <<n1>> :> ro @@
      <<n2>> :> ro @@
      <<n3>> :> n3 @@
      <<n4>> :> n4 @@
      <<n5>> :> n5 )
    /\ acked = ( <<ro>> :> (n1 :> TRUE @@ n2 :> TRUE) @@
      <<n1>> :> (ro :> FALSE @@ n3 :> TRUE) @@
      <<n2>> :> (ro :> FALSE @@ n3 :> TRUE) @@
      <<n3>> :> (n1 :> TRUE @@ n2 :> TRUE @@ n4 :> TRUE @@ n5 :> TRUE) @@
      <<n4>> :> (n3 :> TRUE) @@
      <<n5>> :> (n3 :> TRUE) )
    2217:4 4: <nd(<<n3>>) line 128, col 13 to line 144, col 54 of module Github317a>
    /\ msgs = ( <<ro, n1>> :> <<>> @@
      <<ro, n2>> :> <<>> @@
      <<n1, ro>> :> <<>> @@
      <<n1, n3>> :> <<>> @@
      <<n2, ro>> :> <<>> @@
      <<n2, n3>> :> <<1>> @@
      <<n3, n1>> :> <<>> @@
      <<n3, n2>> :> <<2>> @@
      <<n3, n4>> :> <<2>> @@
      <<n3, n5>> :> <<2>> @@
      <<n4, n3>> :> <<>> @@
      <<n5, n3>> :> <<>> )
    /\ depth = ( <<ro>> :> 0 @@
      <<n1>> :> 1 @@
      <<n2>> :> 1 @@
      <<n3>> :> 2 @@
      <<n4>> :> 7 @@
      <<n5>> :> 7 )
    /\ parent = ( <<ro>> :> ro @@
      <<n1>> :> ro @@
      <<n2>> :> ro @@
      <<n3>> :> n1 @@
      <<n4>> :> n4 @@
      <<n5>> :> n5 )
    /\ acked = ( <<ro>> :> (n1 :> TRUE @@ n2 :> TRUE) @@
      <<n1>> :> (ro :> FALSE @@ n3 :> TRUE) @@
      <<n2>> :> (ro :> FALSE @@ n3 :> TRUE) @@
      <<n3>> :> (n1 :> FALSE @@ n2 :> TRUE @@ n4 :> TRUE @@ n5 :> TRUE) @@
      <<n4>> :> (n3 :> TRUE) @@
      <<n5>> :> (n3 :> TRUE) )
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 149, column 41 to line 149, column 48 in Github317a
    1. Line 128, column 13 to line 144, column 54 in Github317a
    2. Line 129, column 15 to line 144, column 54 in Github317a
    3. Line 139, column 23 to line 144, column 54 in Github317a
    4. Line 139, column 26 to line 139, column 67 in Github317a
    5. Line 140, column 26 to line 143, column 50 in Github317a
    6. Line 140, column 29 to line 140, column 59 in Github317a
    7. Line 140, column 29 to line 140, column 42 in Github317a
    2199:0 17 states generated, 14 distinct states found, 7 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
