(*---
description: Only the first unassigned constant in declaration order is reported.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT A = 1
---*)
---- MODULE one_of_two_constants_unassigned ----
CONSTANTS A, B, C
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter B is not assigned a value by the configuration file.
---*)
