(*---
description: One past the int range in octal is too big.
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [numbers]
outcome: tlc-error
---*)
---- MODULE too_big_octal ----
ASSUME \o20000000000 = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    \o20000000000
---*)
