(*---
description: A SANY code at error level can't be suppressed.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -suppressMessages
  - "4200"
---*)
---- MODULE suppress_sany_error_code ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: code 4200 is an error and cannot be suppressed.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
