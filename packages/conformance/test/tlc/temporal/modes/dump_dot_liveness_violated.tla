(*---
description: '-dump dot with a counterexample.'
ref: tlc2/tool/liveness/DotLivenessStateWriter.java#DotLivenessStateWriter
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -dump
  - dot
  - states
files:
  - states.dot
  - states_liveness.dot
---*)
---- MODULE dump_dot_liveness_violated ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>(x = 99)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 21, col 9 to line 21, col 27 of module dump_dot_liveness_violated>
    x = 1
    2217:4 3: <Next line 21, col 9 to line 21, col 27 of module dump_dot_liveness_violated>
    x = 2
    2218:4 4: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
  files:
    states.dot: |-
      strict digraph DiskGraph {
      node [shape=box,style=rounded]
      nodesep=0.35;
      subgraph cluster_graph {
      color="white";
      -3406341414084290173 [label="x = 0",style = filled]
      -3406341414084290173 -> -686636423115914061 [label="",color="black",fontcolor="black"];
      -686636423115914061 [label="x = 1",tooltip="x = 1"];
      -686636423115914061 -> -7115858903467826205 [label="",color="black",fontcolor="black"];
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
      "-3406341414084290173.0" [style = filled] [label="x = 0
      #-3406341414084290173.0#"]
      "-3406341414084290173.0" -> "-686636423115914061.0" [label="[t]"];
      "-686636423115914061.0" [label="x = 1
      #-686636423115914061.0#"];
      "-3406341414084290173.0" -> "-3406341414084290173.0" [label="[f]"];
      "-3406341414084290173.0" [label="x = 0
      #-3406341414084290173.0#"];
      "-686636423115914061.0" -> "-7115858903467826205.0" [label="[t]"];
      "-7115858903467826205.0" [label="x = 2
      #-7115858903467826205.0#"];
      "-686636423115914061.0" -> "-686636423115914061.0" [label="[f]"];
      "-686636423115914061.0" [label="x = 1
      #-686636423115914061.0#"];
      "-7115858903467826205.0" -> "-7115858903467826205.0" [label="[t]"];
      "-7115858903467826205.0" [label="x = 2
      #-7115858903467826205.0#"];
      }
      }
---*)
