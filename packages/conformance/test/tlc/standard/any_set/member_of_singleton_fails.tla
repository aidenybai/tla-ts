(*---
description: Any \in {Any} compares Any with itself and fails.
ref: tlc2/module/AnySet.java#compareTo
features:
  - AnySet
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE member_of_singleton_fails ----
EXTENDS TLC
Test == Any \in {Any}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
init:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
next:
  exit: 75
  transcript: |-
    2155:1 Attempted to compare ANY with the value
    ANY
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
invariant:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
property:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
---*)
