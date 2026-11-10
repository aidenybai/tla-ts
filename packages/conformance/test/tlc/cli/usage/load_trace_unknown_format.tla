(*---
description: -loadTrace rejects a format it doesn't know.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -loadTrace
  - xml
  - in.xml
---*)
---- MODULE load_trace_unknown_format ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: Unknown format xml given to -loadTrace.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
