(*---
description: A \o number is a NUMBER_LITERAL that Integer.parseInt can't read.
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: tlc-error
config: |
  CONSTANT N = \o17
---*)
---- MODULE int_octal_rejected ----
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
    : For input string: "\o17"
---*)
