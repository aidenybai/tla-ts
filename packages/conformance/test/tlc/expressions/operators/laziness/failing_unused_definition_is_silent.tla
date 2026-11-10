(*---
description: "A failure in an unused constant definition during the startup pass is swallowed."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstantDefns"
flags: [expression]
outcome: success
---*)
---- MODULE failing_unused_definition_is_silent ----
EXTENDS Integers
Unused == 1 \div 0
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
