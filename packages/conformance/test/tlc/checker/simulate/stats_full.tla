(*---
description: stats=full writes an action flow graph without changing the printed output.
ref: tlc2/tool/Simulator.java#writeActionFlowGraphFull
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1,stats=full
  - -depth
  - "2"
files:
  - stats_full_actions.dot
---*)
---- MODULE stats_full ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
  files:
    stats_full_actions.dot: |-
      digraph ActionGraph {
      nodesep=0.35;
      subgraph cluster_legend {
      label = "Coverage";
      node [shape=point] {
      d0 [style = invis];
      d1 [style = invis];
      p0 [style = invis];
      p0 [style = invis];
      }
      d0 -> d1 [label=unseen, color="green", style=dotted]
      p0 -> p1 [label=seen]
      }
      subgraph cluster_2914 {
      color="white"
      label="[]"
      0 [shape=box,label="Init",style = filled]
      1 [shape=box,label="Next"]
      }
      0 -> 1[penwidth=0.11];
      1 -> 1[penwidth=0.11];
      }
---*)
