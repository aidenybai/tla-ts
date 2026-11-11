(*---
description: 'When the start of the SCC''s cycle is not where AE conditions end, the postfix BFS returns to the start: the cycle includes the connecting states.'
ref: tlc2/tool/liveness/LiveWorker.java#bfsPostFix
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE cycle_stack_bfs_postfix ----
EXTENDS Naturals
VARIABLE x
Next == \/ x < 3 /\ x' = x + 1
        \/ x = 3 /\ x' = 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>[](x # 3) \/ <>[](x # 1)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 4 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 12 to line 14, col 30 of module cycle_stack_bfs_postfix>
    x = 1
    2217:4 3: <Next line 14, col 12 to line 14, col 30 of module cycle_stack_bfs_postfix>
    x = 2
    2217:4 4: <Next line 14, col 12 to line 14, col 30 of module cycle_stack_bfs_postfix>
    x = 3
    2122:4 2: Back to state: <Next line 15, col 12 to line 15, col 26 of module cycle_stack_bfs_postfix>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 5 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
