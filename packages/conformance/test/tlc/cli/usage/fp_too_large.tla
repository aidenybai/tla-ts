(*---
description: -fp must index FP64.Polys.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -fp
  - "9999"
---*)
---- MODULE fp_too_large ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: The number for -fp must be between 0 and 130 (inclusive).
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
