(*---
description: -fpmem needs a number.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -fpmem
  - abc
---*)
---- MODULE fpmem_not_number ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: An positive integer or a fraction for fpset memory size/percentage required. But encountered abc
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
