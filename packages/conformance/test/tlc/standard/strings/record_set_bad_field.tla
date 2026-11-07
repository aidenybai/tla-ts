(*---
description: A record whose field is a number makes the field check fail.
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE record_set_bad_field ----
EXTENDS TLC
Test == [a |-> 1] \in [a : STRING]
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
