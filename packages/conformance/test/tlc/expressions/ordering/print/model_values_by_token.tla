(*---
description: "Model values sort by name token, so the declaration order decides."
ref: "tlc2/value/impl/ModelValue.java#compareTo"
flags: [expression]
outcome: success
config: |
  CONSTANT zb = zb
  CONSTANT za = za
---*)
---- MODULE model_values_by_token ----
EXTENDS Integers, TLC
CONSTANT zb, za
Test == PrintT({za, zb})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {zb, za}"
---*)
