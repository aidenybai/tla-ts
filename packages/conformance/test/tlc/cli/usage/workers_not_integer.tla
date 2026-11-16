(*---
description: -workers takes an integer or 'auto'.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -workers
  - abc
---*)
---- MODULE workers_not_integer ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: worker number or 'auto' required. But encountered abc
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
