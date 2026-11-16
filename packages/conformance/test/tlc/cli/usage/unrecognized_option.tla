(*---
description: An argument starting with '-' that no branch matches is an unrecognized option.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -nope
---*)
---- MODULE unrecognized_option ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: unrecognized option: -nope
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
