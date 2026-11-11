(*---
description: A row of equals signs lexes as a token that isn't a keyword, because the file format has no end marker.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT Init
  NEXT Next
  ====
---*)
---- MODULE module_end_line_at_top ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 3
    It was expecting a keyword, but did not find it.
---*)
