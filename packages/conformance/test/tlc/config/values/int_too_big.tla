(*---
description: A number past the int range throws NumberFormatException out of parseValue, which TLC reports as a general error.
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: tlc-error
config: |
  CONSTANT N = 2147483648
---*)
---- MODULE int_too_big ----
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
    The exception was a java.lang.NumberFormatException
    : For input string: "2147483648"
---*)
