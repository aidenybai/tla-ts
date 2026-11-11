(*---
description: -workers rejects a negative count with the same message as zero.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -workers
  - "-3"
---*)
---- MODULE workers_negative ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: at least one worker required.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
