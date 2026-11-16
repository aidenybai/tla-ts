(*---
description: A set of differently-typed model values fails when SetEnumValue sorts it, as a general error.
ref: tlc2/value/impl/ModelValue.java#compareTo
outcome: tlc-error
config: |
  CONSTANT S = {x_1, y_1}
---*)
---- MODULE sort_mixed_types_is_an_error ----
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
    : Attempted to compare the differently-typed model values y_1 and x_1
---*)
