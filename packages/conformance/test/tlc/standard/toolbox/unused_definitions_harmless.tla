(*---
description: Extending Toolbox is harmless when its definitions go unused, even though constant folding them fails.
ref: tlc2/tool/impl/SpecProcessor.java#processConstantDefns
features:
  - Toolbox
flags:
  - expression
outcome: success
---*)
---- MODULE unused_definitions_harmless ----
EXTENDS Toolbox
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
