(*---
description: "'INIT NEXT' followed by a real NEXT section sets the initial predicate to the name NEXT, which the spec doesn't define."
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInitAndNext
outcome: config-error
config: |
  INIT NEXT
  NEXT Next
---*)
---- MODULE init_named_after_keyword ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The initial predicate NEXT specified in the configuration file
    is not defined in the specification.
---*)
