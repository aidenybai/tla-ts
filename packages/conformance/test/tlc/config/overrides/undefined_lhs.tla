(*---
description: Unlike an assignment, an override of a name the spec doesn't have is an error.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT Nope <- D
---*)
---- MODULE undefined_lhs ----
D == 1
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2226:1 In the configuration file, the identifier Nope does not appear in the specification.
---*)
