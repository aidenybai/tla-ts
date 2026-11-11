(*---
description: An undefined NEXT is called the next state action.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  INIT Init
  NEXT Nope
---*)
---- MODULE next ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The next state action Nope specified in the configuration file
    is not defined in the specification.
---*)
