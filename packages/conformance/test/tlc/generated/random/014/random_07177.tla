(*---
description: Evaluates a random int expression, seed 262, number 7177.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07177 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((TRUE \cup 2..1) \subseteq (3 .. -1)) -> Head(SubSeq(<<>>, -1, 1)) [] OTHER -> ((0 \div 0) * (SUBSET {1} \ {})) \div ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] EXCEPT !.a = (1 + 2)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07177 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 23 to line 14, col 58 of module random_07177
---*)
