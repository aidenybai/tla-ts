(*---
description: The record set branch picks each field.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_singleton_record_set ----
EXTENDS TLC, Naturals
Test == RandomElement([a : {1}, b : {"x"}]) = [a |-> 1, b |-> "x"]
====

(*--- recorded
all:
  exit: 0
---*)
