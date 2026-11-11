(*---
description: An empty module name before '!' is refused.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -postCondition
  - "!Op"
---*)
---- MODULE post_condition_empty_module ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Module name for postCondition required. Encountered: !Op
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
