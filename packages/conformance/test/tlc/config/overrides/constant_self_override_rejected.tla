(*---
description: "'N <- N' for a constant fails like a chain, unlike the assignment 'N = N'."
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N <- N
---*)
---- MODULE constant_self_override_rejected ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2223:1 In the configuration file, the identifier N appears
    on the right-hand side of a <- after already appearing on the
    left-hand side of one.
---*)
