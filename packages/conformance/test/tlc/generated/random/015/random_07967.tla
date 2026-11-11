(*---
description: Evaluates a random int expression, seed 262, number 7967.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07967 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b12298 \in ({(<<5, 6>>)[-1] : b12299 \in DOMAIN <<5, 6>>} \cap {LET b12301 == b12300 IN b12301 : b12300 \in {b12302 : b12302 \in {}}}) : (SubSeq([<<3, 1, 2>> EXCEPT ![1] = b12298], (b12298 + 1), Len(<<3, 1, 2>>)) = (({2, 1, 3}).a :> (b12298 \div <<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07967 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
