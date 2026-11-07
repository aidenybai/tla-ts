(*---
description: An evaluation error in Init prints the general error and replays with a call stack under -dfid.
ref: tlc2/tool/DFIDModelChecker.java#doInit
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE init_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 1 \div 0
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    The error occurred when TLC was computing initial states.
    The exception was a tlc2.tool.EvalException
    : @!@!@STARTMSG 2179:0 @!@!@
    The second argument of \div is 0.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    The error occurred when TLC was computing initial states.
    The exception was a tlc2.tool.EvalException
    : @!@!@STARTMSG 2179:0 @!@!@
    The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    tlc2.tool.impl.FastTool@<id>
    2206:0 Progress(-1) at <date>: 0 states generated, 0 distinct states found, -1 states left on queue.
    2204:0 0 states generated, 0 distinct states found.
---*)
