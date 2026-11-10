(*---
description: A dump file that can't be created is reported after all flags are read, with the suffix added.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -dump
  - no_such_directory/states
---*)
---- MODULE dump_invalid_path ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    | Error: Unable to write to file no_such_directory/states.dump
    1102:1 Error: Given file name no_such_directory/states.dump for dumping states invalid.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
