(*---
description: _RL_REWARD may appear only once, and the error gives the keyword and the line of the second use.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  _RL_REWARD Init

  _RL_REWARD Init
---*)
---- MODULE rl_reward ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5004:1 TLC found an error in the configuration file at line 3
    The keyword _RL_REWARD appeared twice.
---*)
