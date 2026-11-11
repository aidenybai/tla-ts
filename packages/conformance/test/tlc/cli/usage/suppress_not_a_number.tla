(*---
description: NumberFormatException is an IllegalArgumentException, so its text becomes the error.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -suppressMessages
  - abc
---*)
---- MODULE suppress_not_a_number ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: For input string: "abc"
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
