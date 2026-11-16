(*---
description: A lone dash starts with '-', so it is an unrecognized option rather than a file name.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - "-"
---*)
---- MODULE single_dash ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: unrecognized option: -
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
