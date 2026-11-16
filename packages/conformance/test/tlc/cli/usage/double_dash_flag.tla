(*---
description: Long-option spelling isn't accepted.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - --deadlock
---*)
---- MODULE double_dash_flag ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: unrecognized option: --deadlock
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
