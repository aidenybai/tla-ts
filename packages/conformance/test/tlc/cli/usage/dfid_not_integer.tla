(*---
description: -dfid needs an integer and repeats the bad value.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -dfid
  - abc
---*)
---- MODULE dfid_not_integer ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: expect a nonnegative integer for -dfid option. But encountered abc
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
