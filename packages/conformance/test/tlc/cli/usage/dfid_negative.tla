(*---
description: -dfid rejects a negative depth.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -dfid
  - "-1"
---*)
---- MODULE dfid_negative ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: expect a nonnegative integer for -dfid option.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
