(*---
description: An undefined PROPERTY is called a property.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Nope
---*)
---- MODULE property ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The property Nope specified in the configuration file
    is not defined in the specification.
---*)
