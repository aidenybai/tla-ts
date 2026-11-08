(*---
description: tuple_pattern applied to set_map, a SetEnumValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in {x + 1 : x \in 1..2}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 16, col 8 to line 16, col 11 of module tuple_pattern_set_map failed.
    2170:0 Argument mismatch in operator application.%1
---*)
