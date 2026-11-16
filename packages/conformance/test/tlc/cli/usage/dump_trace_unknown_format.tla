(*---
description: -dumpTrace rejects a format it doesn't know.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -dumpTrace
  - xml
  - out.xml
---*)
---- MODULE dump_trace_unknown_format ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: Unknown format xml given to -dumpTrace.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
