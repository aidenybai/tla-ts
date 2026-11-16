(*---
description: "The startup walk over the module includes theorem bodies, so a too-big literal in an unchecked theorem still fails."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [numbers]
outcome: tlc-error
---*)
---- MODULE too_big_in_theorem ----
THEOREM 2147483648 = 0
ASSUME TRUE
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    2147483648
---*)
