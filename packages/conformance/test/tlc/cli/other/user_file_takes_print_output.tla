(*---
description: -userFile sends PrintT to the file instead of the console.
ref: tlc2/module/TLC.java#PrintT
outcome: success
config: ""
args:
  - -userFile
  - out.txt
---*)
---- MODULE user_file_takes_print_output ----
EXTENDS TLC
ASSUME PrintT("to the user file")
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
