(*---
description: -depth takes the next argument as its value even if it is a flag.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -depth
  - -config
---*)
---- MODULE depth_consumes_next_flag ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: An integer for trace length required. But encountered -config
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
