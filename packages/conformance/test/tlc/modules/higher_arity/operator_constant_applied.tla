(*---
description: "A declared operator constant may be applied, with its value from the config file."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstantDefns"
features: [higher_arity]
flags: [expression]
config: |
  CONSTANT F <- G
outcome: success
---*)
---- MODULE operator_constant_applied ----
CONSTANT F(_)
G(a) == <<a>>
Test == F(1) = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
