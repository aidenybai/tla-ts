(*---
description: "'D <- D' has a right-hand side that is overridden, so it fails like a chain."
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT D <- D
---*)
---- MODULE self_override_rejected ----
D == 1
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2223:1 In the configuration file, the identifier D appears
    on the right-hand side of a <- after already appearing on the
    left-hand side of one.
---*)
