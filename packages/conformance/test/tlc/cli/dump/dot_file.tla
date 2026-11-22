(*---
description: -dump dot writes a graph.
ref: tlc2/util/DotStateWriter.java
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -dump
  - dot
  - states
files:
  - states.dot
---*)
---- MODULE dot_file ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
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
      -3406341414084290173 -> -686636423115914061 [label="",color="black",fontcolor="black"];
      -686636423115914061 [label="x = 1",tooltip="x = 1"];
      -686636423115914061 -> -7115858903467826205 [label="",color="black",fontcolor="black"];
      -7115858903467826205 [label="x = 2",tooltip="x = 2"];
      -7115858903467826205 -> -3406341414084290173 [label="",color="black",fontcolor="black"];
      {rank = same; -3406341414084290173;}
      {rank = same; -686636423115914061;}
      {rank = same; -7115858903467826205;}
      }
      }
---*)
