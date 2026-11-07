(*---
description: Ported from TLC's TLCGetNamedUndefinedTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/TLCGetNamedUndefinedTest.java
features:
  - tlc-regression
outcome: config-error
config: |
  CONSTANTS
  A <- diameter
  B <- distinct
  C <- queue
  D <- level
args:
  - -deadlock
---*)
------------------------ MODULE TLCGetNamedUndefined ------------------------
EXTENDS TLC

diameter == TLCGet("diameter")
distinct == TLCGet("distinct")
queue == TLCGet("queue")
level == TLCGet("level")

CONSTANT A,B,C,D

ASSUME(TRUE)

=============================================================================

(*--- recorded
all:
  exit: 151
  transcript: |-
    2145:0 TLCGet(diameter) was undefined.
    2145:0 TLCGet(diameter) was undefined.
    2145:0 TLCGet(diameter) was undefined.
---*)
