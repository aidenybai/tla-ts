(*---
description: Ported from TLC's InliningTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/InliningTest.java
features:
  - tlc-regression
outcome: success
config: |
  CONSTANT
  N = 6
  SPECIFICATION
  Spec
args:
  - -deadlock
includes:
  - EWD840.tla
  - EWD840MC2_TTrace_2000000000_Expected.json
---*)
---- MODULE InlineMC ----
EXTENDS EWD840, TLC

===================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2269:0 Computed 32 initial states...
    2269:0 Computed 64 initial states...
    2269:0 Computed 128 initial states...
    2269:0 Computed 256 initial states...
    2269:0 Computed 512 initial states...
    2269:0 Computed 1024 initial states...
    2269:0 Computed 2048 initial states...
    2269:0 Computed 4096 initial states...
    2269:0 Computed 8192 initial states...
    2269:0 Computed 16384 initial states...
    2190:0 Finished computing initial states: 24576 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.4E-9
      based on the actual fingerprints:  val = 3.5E-14
    2199:0 750020 states generated, 36990 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 18.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 10 and the 95th percentile is 2).
---*)
