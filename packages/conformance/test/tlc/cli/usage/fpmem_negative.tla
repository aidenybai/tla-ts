(*---
description: -fpmem rejects a negative value.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -fpmem
  - "-0.5"
---*)
---- MODULE fpmem_negative ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: An positive integer or a fraction for fpset memory size/percentage required. But encountered -0.5
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
