(*---
description: 'SPECIFICATION naming a VARIABLE is rejected because the variable is not an operator definition.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION x
---*)
---- MODULE spec_name_is_variable ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The name x specified in the configuration file
    is not defined in the specification.
---*)
