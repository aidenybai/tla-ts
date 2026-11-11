(*---
description: -invlevel needs an integer.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -invlevel
  - abc
---*)
---- MODULE invlevel_not_integer ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: An integer for -invlevel required. But encountered abc
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
