(*---
description: -seed parses with Long.parseLong, so a value past the long range fails.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -seed
  - "9223372036854775808"
---*)
---- MODULE seed_too_long ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: An integer for seed required. But encountered 9223372036854775808
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
