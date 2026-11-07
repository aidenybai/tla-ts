(*---
description: A code that's neither a TLC nor a SANY code is refused.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -suppressMessages
  - "99999"
---*)
---- MODULE suppress_unknown_code ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: unknown message code: 99999
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
