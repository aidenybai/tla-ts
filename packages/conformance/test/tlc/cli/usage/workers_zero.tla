(*---
description: -workers needs at least one worker.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -workers
  - "0"
---*)
---- MODULE workers_zero ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: at least one worker required.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
