(*---
description: -simulate with file= needs num=.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -simulate
  - file=out
---*)
---- MODULE simulate_file_without_num ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: You need to specify a 'num' argument when using the 'file' argument, for example: '"num=5,file=test.txt"'.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
