(*---
description: A repeated code is the same as one, because the list goes in a set.
ref: tlc2/TLC.java#handleParameters
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -suppressMessages
  - 2193,2193
---*)
---- MODULE repeated_code ----
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
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
