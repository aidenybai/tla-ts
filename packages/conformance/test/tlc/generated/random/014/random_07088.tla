(*---
description: Evaluates a random record expression, seed 262, number 7088.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07088 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((({1} \ Nat) \cap ({1, 2} \cup {1, 2})) \cap (~(<<1, 2>> = [x \in 1..2 |-> x]))), UNION {{([a |-> 1, b |-> TRUE]).a : b10885 \in (TRUE \/ FALSE)}, UNION {{b10886 \in {1, 2} : TRUE}, {2147483647 : b10887 \in 1..3}}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07088 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 154 to line 14, col 166 of module random_07088
---*)
