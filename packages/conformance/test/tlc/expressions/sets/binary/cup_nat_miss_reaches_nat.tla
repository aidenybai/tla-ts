(*---
description: "A string missing from the enumerated side falls through to Nat, which rejects it."
ref: "tlc2/value/impl/SetCupValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE cup_nat_miss_reaches_nat ----
EXTENDS Integers
Test == "b" \in (Nat \cup {"a"})
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
init:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
next:
  exit: 75
  transcript: |-
    2158:1 Attempted to check if the value:
    "b"
    is an element of Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
invariant:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
property:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "b"
    is an element of Nat.
---*)
