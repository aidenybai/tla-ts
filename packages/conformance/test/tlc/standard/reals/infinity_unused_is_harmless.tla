(*---
description: TLC swallows the failure of constant-folding Infinity when nothing uses it.
ref: tlc2/tool/impl/SpecProcessor.java#processConstantDefns
features:
  - Reals
flags:
  - expression
outcome: success
---*)
---- MODULE infinity_unused_is_harmless ----
EXTENDS Reals
Test == 1 + 1 = 2
====

(*--- recorded
all:
  exit: 0
---*)
