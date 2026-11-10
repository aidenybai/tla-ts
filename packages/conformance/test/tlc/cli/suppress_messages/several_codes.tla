(*---
description: The list takes several codes.
ref: tlc2/TLC.java#handleParameters
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -suppressMessages
  - 2193,2199
---*)
---- MODULE several_codes ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
