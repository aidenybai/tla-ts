(*---
description: PrintT of a lazy function evaluates its body, and an error there propagates.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE printt_lazy_function_error ----
EXTENDS TLC, Naturals
Test == PrintT([x \in {1} |-> x \div 0])
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
next:
  exit: 75
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
