(*---
description: A second bare argument is a second input file, and the message names both.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - other_spec
---*)
---- MODULE two_input_files ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: more than one input files: other_spec and two_input_files.tla
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
