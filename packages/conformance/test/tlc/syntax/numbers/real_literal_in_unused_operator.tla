(*---
description: "TLC walks every definition at startup, so a decimal in an unapplied operator with a parameter fails before any evaluation."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [numbers]
outcome: config-error
---*)
---- MODULE real_literal_in_unused_operator ----
Unused(x) == 1.5
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    1.5
---*)
