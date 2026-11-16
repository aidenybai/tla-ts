(*---
description: The same SANY code in both lists is a conflict, and the message lists it by name.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -suppressMessages
  - "4800"
  - -messagesAsErrors
  - "4800"
---*)
---- MODULE suppress_and_as_errors_overlap_sany ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: The following codes were set to both -suppressMessages and -messagesAsErrors: [EXTENDED_MODULES_SYMBOL_UNIFICATION_AMBIGUITY]
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
