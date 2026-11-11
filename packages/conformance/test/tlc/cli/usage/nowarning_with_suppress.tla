(*---
description: -nowarning with -suppressMessages is a conflict, checked after all flags are read.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -nowarning
  - -suppressMessages
  - "2149"
---*)
---- MODULE nowarning_with_suppress ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: -nowarning already suppresses all warnings, making -suppressMessages redundant. Remove -nowarning to suppress only the specified messages, or remove -suppressMessages to suppress all warnings.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
