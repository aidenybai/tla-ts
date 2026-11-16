(*---
description: An undefined SPECIFICATION reports the name.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  SPECIFICATION Nope
---*)
---- MODULE specification ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The name Nope specified in the configuration file
    is not defined in the specification.
---*)
