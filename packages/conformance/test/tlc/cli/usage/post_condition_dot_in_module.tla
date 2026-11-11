(*---
description: A dot in the module name is refused.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -postCondition
  - a.b!Op
---*)
---- MODULE post_condition_dot_in_module ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Module name for postCondition must not contain a dot. Encountered: a.b
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
