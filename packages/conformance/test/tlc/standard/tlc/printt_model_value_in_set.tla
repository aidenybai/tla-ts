(*---
description: A set of model values and a mix with other types print.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE printt_model_value_in_set ----
EXTENDS TLC, Naturals
CONSTANT mv
Test == PrintT({mv, 1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {mv, 1}"
---*)
