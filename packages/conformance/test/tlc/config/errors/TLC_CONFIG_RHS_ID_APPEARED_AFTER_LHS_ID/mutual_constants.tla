(*---
description: Two constants that override each other fail on the first in declaration order.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANTS A <- B
  B <- A
---*)
---- MODULE mutual_constants ----
CONSTANTS A, B
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2223:1 In the configuration file, the identifier B appears
    on the right-hand side of a <- after already appearing on the
    left-hand side of one.
---*)
