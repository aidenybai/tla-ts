(*---
description: -messagesAsErrors refuses an unknown code too.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -messagesAsErrors
  - "99999"
---*)
---- MODULE as_errors_unknown_code ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: unknown message code: 99999
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
