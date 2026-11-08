(*---
description: Evaluates a random int expression, seed 262, number 536.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00536 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({3, 2} \subseteq SortSeq(0, LAMBDA p, q : p < q)) \/ (~{b905 : b905 \in {1}})))[(((Nat \cap SUBSET {1}) \cup ({1} \ 2..1)) \subseteq ({b906 \in {} : TRUE} \cup DOMAIN (1 :> 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00536 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    0
---*)
