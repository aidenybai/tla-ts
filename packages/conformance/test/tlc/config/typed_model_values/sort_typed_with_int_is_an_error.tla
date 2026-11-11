(*---
description: A set of a typed model value and an integer fails when SetEnumValue sorts it, as a general error.
ref: tlc2/value/impl/ModelValue.java#modelValueCompareTo
outcome: tlc-error
config: |
  CONSTANT S = {x_1, 1}
---*)
---- MODULE sort_typed_with_int_is_an_error ----
EXTENDS TLC
CONSTANT S
ASSUME PrintT(S)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare the typed model value x_1 and the non-model value
    1
---*)
