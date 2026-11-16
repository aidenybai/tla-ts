(*---
description: Ported from TLC's DepthFirstErrorTraceTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/DepthFirstErrorTraceTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |-
  SPECIFICATION
  Spec
  INVARIANT
  Inv
args:
  - -dfid
  - "9"
  - -deadlock
---*)
--------------------------- MODULE DepthFirstErrorTrace ---------------------------
EXTENDS Integers

VARIABLES x

Spec == (x=0) /\ [][x'=x+1]_<<x>>

Inv == x < 7
=============================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2205:0 Starting level 3: 2 states generated, 2 distinct states found.
    2205:0 Starting level 4: 4 states generated, 3 distinct states found.
    2205:0 Starting level 5: 7 states generated, 4 distinct states found.
    2205:0 Starting level 6: 11 states generated, 5 distinct states found.
    2205:0 Starting level 7: 16 states generated, 6 distinct states found.
    2205:0 Starting level 8: 22 states generated, 7 distinct states found.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: 
    x = 0
    2217:4 2: 
    x = 1
    2217:4 3: 
    x = 2
    2217:4 4: 
    x = 3
    2217:4 5: 
    x = 4
    2217:4 6: 
    x = 5
    2217:4 7: 
    x = 6
    2217:4 8: 
    x = 7
    2206:0 Progress(-1) at <date>: 29 states generated, 8 distinct states found, -1 states left on queue.
    2204:0 29 states generated, 8 distinct states found.
---*)
