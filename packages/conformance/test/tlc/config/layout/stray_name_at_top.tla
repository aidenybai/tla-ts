(*---
description: A bare name where a section should start is rejected, and the error gives its line.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT Init
  NEXT Next

  Stray
---*)
---- MODULE stray_name_at_top ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 4
    It was expecting a keyword, but did not find it.
---*)
