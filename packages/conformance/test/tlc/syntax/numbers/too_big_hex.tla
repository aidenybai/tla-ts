(*---
description: One past the int range in hex is too big.
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [numbers]
outcome: tlc-error
---*)
---- MODULE too_big_hex ----
ASSUME \h80000000 = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    \h80000000
---*)
