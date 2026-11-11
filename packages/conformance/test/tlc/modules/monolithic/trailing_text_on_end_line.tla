(*---
description: "Extraction stops at any line starting with four equals signs, and the parser ignores what follows the end."
ref: "util/MonolithSpecExtractor.java#module"
features: [monolithic]
outcome: success
---*)
---- MODULE trailing_text_on_end_line ----
EXTENDS Other
ASSUME A = 1
====
---- MODULE Other ----
A == 1
==== trailing

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
