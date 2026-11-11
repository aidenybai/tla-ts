(*---
description: Evaluates a random set expression, seed 262, number 9185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({3, 2147483647} \cup (-1 .. 2)) \cup UNION {{b14256 : b14256 \in [a |-> 1, b |-> TRUE]}, UNION {SUBSET {1}, {2, 1, 3}}}) \cup {SelectSeq(<<-1, 7>>, LAMBDA e : e > 0), Cardinality([[a |-> 1] EXCEPT !.a = 3])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09185 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> TRUE].
    line 14, col 84 to line 14, col 104 of module random_09185
---*)
