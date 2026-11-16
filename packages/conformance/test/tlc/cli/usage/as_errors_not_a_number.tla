(*---
description: -messagesAsErrors reports the parse failure's text.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -messagesAsErrors
  - abc
---*)
---- MODULE as_errors_not_a_number ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: For input string: "abc"
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
