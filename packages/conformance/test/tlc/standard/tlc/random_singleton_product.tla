(*---
description: The product branch picks each component.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_singleton_product ----
EXTENDS TLC, Naturals
Test == RandomElement({1} \X {"a"}) = <<1, "a">>
====

(*--- recorded
all:
  exit: 0
---*)
