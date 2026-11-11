(*---
description: -coverage rejects a negative interval.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -coverage
  - "-1"
---*)
---- MODULE coverage_negative ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: expect a nonnegative integer for -coverage option.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
