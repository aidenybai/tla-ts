(*---
description: The conflict doesn't depend on the order of the two flags.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -suppressMessages
  - "2149"
  - -nowarning
---*)
---- MODULE suppress_then_nowarning ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: -nowarning already suppresses all warnings, making -suppressMessages redundant. Remove -nowarning to suppress only the specified messages, or remove -suppressMessages to suppress all warnings.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
