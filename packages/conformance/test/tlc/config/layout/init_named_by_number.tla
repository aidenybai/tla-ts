(*---
description: INIT accepts any token as a name, so a number passes the parser and fails as an undefined initial predicate.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInitAndNext
outcome: config-error
config: |
  INIT 1
  NEXT Next
---*)
---- MODULE init_named_by_number ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The initial predicate 1 specified in the configuration file
    is not defined in the specification.
---*)
