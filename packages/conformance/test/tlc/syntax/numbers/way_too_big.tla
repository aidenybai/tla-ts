(*---
description: A number past the long range still parses and fails only in TLC.
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [numbers]
outcome: tlc-error
---*)
---- MODULE way_too_big ----
ASSUME 99999999999999999999999999 = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    99999999999999999999999999
---*)
