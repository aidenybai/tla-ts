(*---
description: -fp needs a number.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -fp
  - abc
---*)
---- MODULE fp_not_integer ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: A number for -fp is required. But encountered abc
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
