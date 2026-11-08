(*---
description: "An evaluation error in an invariant on an initial state under -dfid prints the error, yet exits 0. This is a TLC bug: DFIDModelChecker.modelCheck prints the failure but never assigns it to result."
ref: tlc2/tool/DFIDModelChecker.java#doInit
features:
  - tlc-bug
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -dfid
  - "10"
---*)
---- MODULE invariant_error_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == 1 \div x = 0
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2102:1 While working on the initial state:
    x = 0
    2179:0 The second argument of \div is 0.
    2206:0 Progress(-1) at <date>: 1 states generated, 1 distinct states found, -1 states left on queue.
    2204:0 1 states generated, 1 distinct states found.
---*)
