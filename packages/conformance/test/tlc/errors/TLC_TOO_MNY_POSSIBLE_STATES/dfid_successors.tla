(*---
description: Depth-first checking collects successors in a StateVec too, with the same wrapped message.
ref: tlc2/tool/StateVec.java#grow
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "2"
  - -maxSetSize
  - "2"
---*)
---- MODULE dfid_successors ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' \in 1..9
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    The error occurred when TLC was computing the set of next states.
    The exception was a java.lang.RuntimeException
    :
    2172:0 Too many possible next states for the last state in the trace.
    2121:1 The behavior up to this point is:
    2216:4 1:
    x = 0
    2206:0 Progress(-1) at <date>: 1 states generated, 1 distinct states found, -1 states left on queue.
    2204:0 1 states generated, 1 distinct states found.
---*)
