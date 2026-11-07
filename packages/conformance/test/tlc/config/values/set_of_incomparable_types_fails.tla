(*---
description: A set mixing an integer and a string parses, and then fails when it is normalized, because a string can't be compared with a non-string. It surfaces as a general error.
ref: tlc2/value/impl/StringValue.java#compareTo
outcome: tlc-error
config: |
  CONSTANT N = {1, "a", m}
---*)
---- MODULE set_of_incomparable_types_fails ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare string "a" with non-string:
    1
---*)
