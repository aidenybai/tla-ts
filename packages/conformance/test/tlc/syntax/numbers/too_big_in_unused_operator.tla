(*---
description: "TLC walks every definition at startup, so a too-big literal in an unapplied operator fails before any evaluation."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [numbers]
outcome: tlc-error
---*)
---- MODULE too_big_in_unused_operator ----
Unused(x) == 2147483648
ASSUME TRUE
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    2147483648
---*)
