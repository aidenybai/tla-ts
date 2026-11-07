(*---
description: Inclusion of a set holding a number asks a failing membership.
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subseteq_with_non_string ----
EXTENDS TLC
Test == {1} \subseteq STRING
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
init:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
next:
  exit: 75
  transcript: |-
    2158:1 Attempted to check if the value:
    1
    is an element of STRING.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
invariant:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
property:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
---*)
