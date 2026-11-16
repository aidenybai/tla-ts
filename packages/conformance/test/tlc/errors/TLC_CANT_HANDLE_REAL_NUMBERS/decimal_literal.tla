(*---
description: A decimal literal stops TLC while it processes the spec, before any assumption runs, even with the Reals module.
ref: tlc2/tool/impl/SpecProcessor.java#processConstants
outcome: config-error
config: ""
---*)
---- MODULE decimal_literal ----
EXTENDS Reals
ASSUME 1.5 > 1
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    1.5
---*)
