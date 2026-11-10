(*---
description: "-invlevel with a non-integer value is a usage error."
ref: tlc2/TLC.java#process
outcome: usage-error
config: |
  INIT Init
  NEXT Next
args:
  - -invlevel
  - x
---*)
---- MODULE invlevel_flag_not_integer ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: An integer for -invlevel required. But encountered x
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
