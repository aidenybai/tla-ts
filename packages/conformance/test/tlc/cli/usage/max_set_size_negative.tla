(*---
description: -maxSetSize rejects a negative bound.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -maxSetSize
  - "-1"
---*)
---- MODULE max_set_size_negative ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: Value in interval [0, 2147483647] for maxSetSize required. But encountered -1
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
