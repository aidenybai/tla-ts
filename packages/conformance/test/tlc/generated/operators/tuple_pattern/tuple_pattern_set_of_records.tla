(*---
description: tuple_pattern applied to set_of_records, a SetOfRcdsValue.
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
      2105:1 Evaluating assumption line 22, col 8 to line 22, col 11 of module tuple_pattern_set_of_records failed.
      2170:0 Argument mismatch in operator application.line 21, col 23 to line 21, col 23 of module tuple_pattern_set_of_records
---*)
---- MODULE tuple_pattern_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in [a : {1, 2}]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 22, col 8 to line 22, col 11 of module tuple_pattern_set_of_records failed.
    2170:0 Argument mismatch in operator application.%1
---*)
