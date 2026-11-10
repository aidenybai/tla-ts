(*---
description: Sets a constant to too_big through assignment, then uses it through cardinality.
ref: tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants
features:
  - config-values
  - tlc-bug
outcome: any
config: |
  CONSTANT c = 2147483648
  CONSTANT m = m
  CONSTANT n = n
  CONSTANT t_a = t_a
  CONSTANT t_b = t_b
correct:
  all:
    exit: 255
    transcript: |-
      2265:1 TLC can't handle a number this big.
      2147483648
---*)
---- MODULE cfg_assignment__too_big__cardinality ----
EXTENDS Integers, Sequences, FiniteSets, TLC
CONSTANTS c, m, n, t_a, t_b
Def == 7
ASSUME PrintT(Cardinality(c))
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
