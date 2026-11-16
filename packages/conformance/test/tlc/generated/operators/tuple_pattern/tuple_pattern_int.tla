(*---
description: tuple_pattern applied to int, a UserValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in Int})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_int failed.
    TLC encountered the non-enumerable quantifier bound
    Int
    line 14, col 34 to line 14, col 36 of module tuple_pattern_int
    The set Int contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Int, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Int for any finite set T.
---*)
