(*---
description: INIT takes the next token whatever it is, so 'INIT NEXT' names the initial predicate NEXT, and the following Next isn't a keyword.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT NEXT Next
---*)
---- MODULE init_consumes_next_keyword ----
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
