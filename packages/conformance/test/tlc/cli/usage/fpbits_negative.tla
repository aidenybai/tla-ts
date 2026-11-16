(*---
description: -fpbits must be at least 0.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -fpbits
  - "-1"
---*)
---- MODULE fpbits_negative ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: Value in interval [0, 30] for fpbits required. But encountered -1
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
