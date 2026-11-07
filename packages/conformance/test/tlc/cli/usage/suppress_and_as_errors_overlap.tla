(*---
description: The same TLC code in both lists is a conflict, and the message lists it.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -suppressMessages
  - 2149,2193
  - -messagesAsErrors
  - "2149"
---*)
---- MODULE suppress_and_as_errors_overlap ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: The following codes were set to both -suppressMessages and -messagesAsErrors: [2149]
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
