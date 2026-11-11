(*---
description: "A decimal literal is rejected at startup even in a branch that never runs."
ref: "tlc2/tool/impl/SpecProcessor.java#DecimalKind"
flags: [expression]
outcome: config-error
---*)
---- MODULE decimal_in_dead_branch ----
EXTENDS Integers
Test == IF FALSE THEN 1.5 = 0 ELSE TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    1.5
---*)
