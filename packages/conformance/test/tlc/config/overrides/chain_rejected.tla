(*---
description: "A right-hand side that is itself overridden is rejected: overrides don't chain."
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N <- D
  D <- E
---*)
---- MODULE chain_rejected ----
CONSTANT N
D == 1
E == 2
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
