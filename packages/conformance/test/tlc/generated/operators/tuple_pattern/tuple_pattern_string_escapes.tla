(*---
description: tuple_pattern applied to string_escapes, a StringValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in "a\"b\\c\n"})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_string_escapes failed.
    TLC encountered a non-enumerable quantifier bound
    "a\"b\\c\n".
    line 14, col 34 to line 14, col 44 of module tuple_pattern_string_escapes
---*)
