(*---
description: Flags compare with equals, so -DEADLOCK isn't -deadlock.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -DEADLOCK
---*)
---- MODULE flag_is_case_sensitive ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: unrecognized option: -DEADLOCK
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
