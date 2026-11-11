(*---
description: -seed needs an integer.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -seed
  - abc
---*)
---- MODULE seed_not_integer ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: An integer for seed required. But encountered abc
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
