(*---
description: An empty item in the list fails Integer.parseInt.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -suppressMessages
  - 2149,,2193
---*)
---- MODULE suppress_empty_item ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: For input string: ""
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
