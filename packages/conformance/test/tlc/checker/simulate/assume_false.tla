(*---
description: A false ASSUME stops simulation before it starts.
ref: tlc2/TLC.java#process
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "1"
---*)
---- MODULE assume_false ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
ASSUME FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 19, col 8 to line 19, col 12 of module assume_false is false.
---*)
