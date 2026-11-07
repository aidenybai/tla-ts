(*---
description: "DOMAIN does not keep its argument lazy, so a function over an interval runs its body."
ref: "tlc2/tool/impl/Tool.java#OPCODE_domain"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE domain_forces_reducible ----
EXTENDS Integers
Test == DOMAIN [x \in 1..2 |-> 1 \div 0] = 1..2
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
