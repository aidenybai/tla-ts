(*---
description: tuple_pattern applied to set_diff, a SetDiffValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
correct:
  all:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 22, col 8 to line 22, col 11 of module tuple_pattern_set_diff failed.
      2170:0 Argument mismatch in operator application.line 21, col 23 to line 21, col 23 of module tuple_pattern_set_diff
---*)
---- MODULE tuple_pattern_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in {1, 2} \ {2}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 22, col 8 to line 22, col 11 of module tuple_pattern_set_diff failed.
    2170:0 Argument mismatch in operator application.%1
---*)
