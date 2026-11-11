(*---
description: A dot in the operator name is refused.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -postCondition
  - Mod!a.b
---*)
---- MODULE post_condition_dot_in_operator ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Operator name for postCondition must not contain a dot. Encountered: a.b
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
