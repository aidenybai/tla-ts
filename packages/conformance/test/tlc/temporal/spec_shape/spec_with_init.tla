(*---
description: 'SPECIFICATION together with INIT is rejected before the specification is looked up.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Missing
  INIT Init
---*)
---- MODULE spec_with_init ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
====

(*--- recorded
all:
  exit: 151
  transcript: 2227:1 The configuration file cannot specify both INIT/NEXT and SPECIFICATION fields.
---*)
