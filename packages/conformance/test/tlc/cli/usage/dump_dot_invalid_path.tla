(*---
description: A dot dump file gets the .dot suffix in the same message.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -dump
  - dot
  - no_such_directory/states
---*)
---- MODULE dump_dot_invalid_path ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    | Error: Unable to write to file no_such_directory/states.dot
    1102:1 Error: Given file name no_such_directory/states.dot for dumping states invalid.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
