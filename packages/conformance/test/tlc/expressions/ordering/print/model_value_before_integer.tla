(*---
description: "An untyped model value sorts before an integer."
ref: "tlc2/value/impl/ModelValue.java#compareTo"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE model_value_before_integer ----
EXTENDS Integers, TLC
CONSTANT mv
Test == PrintT({1, mv})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {mv, 1}"
---*)
