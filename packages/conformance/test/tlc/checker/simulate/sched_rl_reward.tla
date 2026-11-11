(*---
description: sched=rl with an integer _RL_REWARD uses it to score transitions.
ref: tlc2/tool/impl/Tool.java#evalReward
outcome: success
config: |
  INIT Init
  NEXT Next
  _RL_REWARD Reward
args:
  - -simulate
  - num=2,sched=rl
  - -depth
  - "4"
---*)
---- MODULE sched_rl_reward ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A == x' = (x + 1) % 3
B == x' = x
Next == A \/ B
Reward == x'
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(2) at <date>: 9 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(2) at <date>: 9 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 9
    Simulation using seed 4 and aril 0
---*)
