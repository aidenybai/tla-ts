(*---
description: isValidSetSize rejects a bound under 1, though the message says the interval starts at 0.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -maxSetSize
  - "0"
---*)
---- MODULE max_set_size_zero ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: Value in interval [0, 2147483647] for maxSetSize required. But encountered 0
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
