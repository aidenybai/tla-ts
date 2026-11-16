(*---
description: Evaluates a random seq expression, seed 262, number 4971.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04971 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] = [<<>> EXCEPT !.a = @ + 0]), LET b7744 == (TRUE \div 7) IN Cardinality({}), IF ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) THEN [[a |-> 1] EXCEPT !.a = 1] ELSE Cardinality([a |-> 1, b |-> TRUE])), Cardinality(((-1 + 1) .. (0 - 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04971 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
