(*---
description: TLCGet("config") in model checking has no depth field, so selecting it fails.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE config_depth_traces_bfs ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ PrintT(<<TLCGet("config").depth, TLCGet("config").traces>>)
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 Attempted to select nonexistent field "depth" from the record
    [ mode |-> "bfs",
      deadlock |-> TRUE,
      worker |-> 1,
      seed |-> "4",
      fingerprint |-> "-7992595565342442794",
      install |->
          "/Users/aidenybai/Developer/tla-ts/.claude/worktrees/tlc-conformance/packages/tlc-conformance/.tlc/tla2tools.jar" ]
    line 12, col 27 to line 12, col 48 of module config_depth_traces_bfs
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 76 in config_depth_traces_bfs
    1. Line 12, column 9 to line 12, column 13 in config_depth_traces_bfs
    2. Line 12, column 18 to line 12, column 76 in config_depth_traces_bfs
    3. Line 12, column 25 to line 12, column 75 in config_depth_traces_bfs
    4. Line 12, column 27 to line 12, column 48 in config_depth_traces_bfs
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
