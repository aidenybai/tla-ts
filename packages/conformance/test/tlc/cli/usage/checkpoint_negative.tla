(*---
description: -checkpoint rejects a negative interval.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -checkpoint
  - "-1"
---*)
---- MODULE checkpoint_negative ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: expect a nonnegative integer for -checkpoint option.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
