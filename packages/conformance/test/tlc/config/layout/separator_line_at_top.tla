(*---
description: A row of dashes lexes as a token that isn't a keyword.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  ---- foo ----
  INIT Init
  NEXT Next
---*)
---- MODULE separator_line_at_top ----
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
