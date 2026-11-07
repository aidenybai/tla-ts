(*---
description: A function set with empty domain has one element, the empty function.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_empty_domain_function_set ----
EXTENDS TLC, Naturals
Test == RandomElement([{} -> {1}]) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
