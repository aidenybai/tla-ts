(*---
description: tuple_pattern applied to seq_set, a UserValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in Seq({1})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_seq_set failed.
    TLC encountered the non-enumerable quantifier bound
    Seq({1})
    line 14, col 34 to line 14, col 41 of module tuple_pattern_seq_set
    In TLA+, Seq(S) represents the set of all finite sequences whose elements come from the set S. Even when S
    is a finite set, the number of possible sequences in Seq(S) is unbounded because sequences can have any
    finite length (e.g., length 0, 1, 2, and so on). As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Seq({1}), because this would require checking an
    infinite number of cases. Note that for a finite set of sequences s, TLC handles s \subseteq Seq(S).
    See https://explain.tlapl.us/seq-unenumerable for additional details.
---*)
