(*---
description: "TLC evaluates a parameterless constant definition at startup, so even an unused one holding a decimal fails."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [numbers]
outcome: config-error
---*)
---- MODULE real_literal_in_unused_constant_definition ----
Unused == 1.5
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    1.5
---*)
