(*---
description: Only CONSTANT left-hand sides join '!' names, so after 'INIT I' the '!' token is not a keyword.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT I!Init
  NEXT Next
---*)
---- MODULE bang_after_init_name ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting a keyword, but did not find it.
---*)
