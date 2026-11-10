(*---
description: _RL_REWARD at the end of the file is missing its operand, and the error gives the keyword and line.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  
  _RL_REWARD
---*)
---- MODULE rl_reward_at_eof ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5003:1 TLC found an error in the configuration file at line 2
    The keyword _RL_REWARD was not followed by an identifier.
---*)
