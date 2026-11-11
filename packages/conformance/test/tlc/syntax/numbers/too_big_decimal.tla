(*---
description: One past the int range is too big for TLC.
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [numbers]
outcome: tlc-error
---*)
---- MODULE too_big_decimal ----
ASSUME 2147483648 = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    2147483648
---*)
