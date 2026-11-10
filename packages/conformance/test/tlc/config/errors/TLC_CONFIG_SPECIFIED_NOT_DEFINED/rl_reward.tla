(*---
description: An undefined _RL_REWARD is called an rlreward.
ref: tlc2/tool/impl/SpecProcessor.java#processRLReward
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _RL_REWARD Nope
---*)
---- MODULE rl_reward ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The rlreward Nope specified in the configuration file
    is not defined in the specification.
---*)
