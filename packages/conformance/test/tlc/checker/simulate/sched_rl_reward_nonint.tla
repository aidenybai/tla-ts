(*---
description: sched=rl with a non-integer _RL_REWARD fails with the expected-value error.
ref: tlc2/tool/impl/Tool.java#evalReward
outcome: evaluation-failure
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
---- MODULE sched_rl_reward_nonint ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A == x' = (x + 1) % 3
B == x' = x
Next == A \/ B
Reward == "a"
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2215:1 TLC expected a integer value, but did not find one. line 22, col 11 to line 22, col 13 of module sched_rl_reward_nonint
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 18, col 9 to line 18, col 13 of module sched_rl_reward_nonint>
    x = 0
    2217:4 2: <A line 19, col 6 to line 19, col 21 of module sched_rl_reward_nonint>
    x = 1
    2217:4 3: <A line 19, col 6 to line 19, col 21 of module sched_rl_reward_nonint>
    x = 2
    2217:4 4: <A line 19, col 6 to line 19, col 21 of module sched_rl_reward_nonint>
    x = 0
    2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
---*)
