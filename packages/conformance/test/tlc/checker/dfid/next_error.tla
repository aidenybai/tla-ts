(*---
description: An evaluation error in Next prints the state and replays with the call stack under -dfid.
ref: tlc2/tool/DFIDModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE next_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 \div x
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
    The exception was a tlc2.tool.EvalException
    : @!@!@STARTMSG 2179:0 @!@!@
    The second argument of \div is 0.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    The error occurred when TLC was computing the set of next states.
    The exception was a tlc2.tool.EvalException
    : @!@!@STARTMSG 2179:0 @!@!@
    The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2216:4 1:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 21 in next_error
    1. Line 16, column 14 to line 16, column 21 in next_error
    2206:0 Progress(-1) at <date>: 1 states generated, 1 distinct states found, -1 states left on queue.
    2204:0 1 states generated, 1 distinct states found.
---*)
