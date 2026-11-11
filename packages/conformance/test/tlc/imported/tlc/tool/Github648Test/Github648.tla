(*---
description: Ported from TLC's Github648Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github648Test.java
features:
  - tlc-regression
outcome: success
config: |-
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTANT Graph <- TestGraph
args:
  - -deadlock
---*)
	--------------------- MODULE Github648 -----------------------------
EXTENDS TLC, Naturals, Sequences, FiniteSets

BoundedSeqTLCEval(S, n) ==
  \* The TLCEval here must not cache the value, because it depends on the
  \* context, ie. S and n.
  UNION {TLCEval([1..m -> S]) : m \in 0..n}

ASSUME Cardinality(BoundedSeqTLCEval(BoundedSeqTLCEval({1,2}, 2), 2)) = 57

-----------------------------------------------------------------------------
BoundedSeq(S, n) ==
  UNION {[1..m -> S] : m \in 0..n}

-----------------------------------------------------------------------------
DirectedGraphs(nodes) ==
    [edge : SUBSET (nodes \X nodes)]

TestGraph ==
    \* The definition of TestGraph is evaluated multiple times.  If the def.
    \* involves TLC!RandomElement or Randomization!* the invariant Inv below
    \* will be violated *without* the TLCEval.
    TLCEval(
    	LET g == RandomElement(DirectedGraphs(1..3)) 
    	IN [ edge |-> g.edge \cup {<<1,1>>} ]
    )

-----------------------------------------------------------------------------
CONSTANT Graph

VARIABLE v, w
vars == <<v, w>>

Init ==
    /\ v \in Graph.edge
    /\ w \in Graph.edge

Next ==
    /\ v' \in Graph.edge
    /\ w' \in Graph.edge

Inv ==
    /\ v \in Graph.edge
    /\ v \in TestGraph.edge
    /\ w \in Graph.edge
    /\ w \in TestGraph.edge
    /\ TLCEval(Cardinality(
    	TLCEval(BoundedSeq(
    		TLCEval(BoundedSeq({1,2,3}, 3)), 3)))) = 65641

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2269:0 Computed 32 initial states...
    2190:0 Finished computing initial states: 36 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.5E-15
    2199:0 1332 states generated, 36 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
