(*---
description: A -userFile that can't be created is refused.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -userFile
  - no_such_directory/out.txt
---*)
---- MODULE user_file_invalid ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: Failed to create user output log file.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
