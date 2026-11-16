(*---
description: An undefined right-hand side fails as a wrong substitution for a constant.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N <- Nope
---*)
---- MODULE undefined_rhs ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for N with the undefined identifier Nope.
---*)
