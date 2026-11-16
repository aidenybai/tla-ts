(*---
description: -fp must be at least 0.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -fp
  - "-1"
---*)
---- MODULE fp_negative ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: The number for -fp must be between 0 and 130 (inclusive).
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
