(*---
description: -fpbits must be at most 30.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -fpbits
  - "31"
---*)
---- MODULE fpbits_too_large ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: Value in interval [0, 30] for fpbits required. But encountered 31
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
