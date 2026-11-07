(*---
description: A string token keeps its quotes as the name, so it can't match the definition called Init.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT "Init"
  NEXT Next
---*)
---- MODULE init_named_by_string ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The initial predicate "Init" specified in the configuration file
    is not defined in the specification.
---*)
