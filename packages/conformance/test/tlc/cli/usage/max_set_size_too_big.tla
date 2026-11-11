(*---
description: -maxSetSize parses an int, so a value past the int range fails.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -maxSetSize
  - "2147483648"
---*)
---- MODULE max_set_size_too_big ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: An integer for maxSetSize required. But encountered 2147483648
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
