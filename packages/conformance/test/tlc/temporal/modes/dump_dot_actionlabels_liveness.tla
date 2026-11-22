(*---
description: '-dump dot,actionlabels with a tableau formula.'
ref: tlc2/tool/liveness/DotLivenessStateWriter.java#DotLivenessStateWriter
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -dump
  - dot,actionlabels
  - states
files:
  - states.dot
  - states_liveness.dot
---*)
---- MODULE dump_dot_actionlabels_liveness ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x = 1 ~> x = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
  files:
    states.dot: |-
      strict digraph DiskGraph {
      node [shape=box,style=rounded]
      nodesep=0.35;
      subgraph cluster_graph {
      color="white";
      -3406341414084290173 [label="x = 0",style = filled]
      -3406341414084290173 -> -686636423115914061 [label="Next",color="black",fontcolor="black"];
      -686636423115914061 [label="x = 1",tooltip="x = 1"];
      -686636423115914061 -> -7115858903467826205 [label="Next",color="black",fontcolor="black"];
      -7115858903467826205 [label="x = 2",tooltip="x = 2"];
      {rank = same; -3406341414084290173;}
      {rank = same; -686636423115914061;}
      }
      }
    states_liveness.dot: |-
      digraph DiskGraph {
      node [shape=box,style=rounded]
      nodesep=0.35;
      subgraph cluster_graph {
      color="white";
      "-3406341414084290173.1" [style = filled] [label="x = 0
      #-3406341414084290173.1#"]
      "-3406341414084290173.1" -> "-686636423115914061.0" [label="[t]"];
      "-686636423115914061.0" [label="x = 1
      #-686636423115914061.0#"];
      "-3406341414084290173.1" -> "-686636423115914061.1" [label="[t]"];
      "-686636423115914061.1" [label="x = 1
      #-686636423115914061.1#"];
      "-3406341414084290173.1" -> "-3406341414084290173.1" [label="[f]"];
      "-3406341414084290173.1" [label="x = 0
      #-3406341414084290173.1#"];
      "-686636423115914061.0" -> "-686636423115914061.2" [label="[f]"];
      "-686636423115914061.2" [label="x = 1
      #-686636423115914061.2#"];
      "-686636423115914061.1" -> "-7115858903467826205.1" [label="[t]"];
      "-7115858903467826205.1" [label="x = 2
      #-7115858903467826205.1#"];
      "-686636423115914061.1" -> "-686636423115914061.0" [label="[f]"];
      "-686636423115914061.0" [label="x = 1
      #-686636423115914061.0#"];
      "-686636423115914061.1" -> "-686636423115914061.1" [label="[f]"];
      "-686636423115914061.1" [label="x = 1
      #-686636423115914061.1#"];
      "-7115858903467826205.1" -> "-7115858903467826205.1" [label="[t]"];
      "-7115858903467826205.1" [label="x = 2
      #-7115858903467826205.1#"];
      }
      }
---*)
