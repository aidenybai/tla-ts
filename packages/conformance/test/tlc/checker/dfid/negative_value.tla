(*---
description: -dfid with a negative value is a usage error.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "-1"
---*)
---- MODULE negative_value ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: expect a nonnegative integer for -dfid option.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
