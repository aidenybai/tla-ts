(*---
description: "Outside an application a function over a Reducible domain is built at once, so every body runs."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE compare_forces_constructor ----
EXTENDS Integers
Test == [x \in 1..2 |-> IF x = 1 THEN 7 ELSE 1 \div 0] # <<>>
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
