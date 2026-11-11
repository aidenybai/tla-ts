(*---
description: file= without num= is a usage error.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - file=trace
---*)
---- MODULE file_without_num ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: You need to specify a 'num' argument when using the 'file' argument, for example: '"num=5,file=test.txt"'.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
