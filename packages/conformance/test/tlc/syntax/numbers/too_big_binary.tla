(*---
description: One past the int range in binary is too big.
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [numbers]
outcome: tlc-error
---*)
---- MODULE too_big_binary ----
ASSUME \b10000000000000000000000000000000 = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    \b10000000000000000000000000000000
---*)
