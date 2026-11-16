(*---
description: Evaluates a random int expression, seed 262, number 6473.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06473 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b9964 \in {((<<>> = <<5, 6>>)).a, Head([<<3, 1, 2>> EXCEPT ![1] = -1])} : ((({1, 2} \cap 1..3) = UNION {SUBSET {1}, {2, 1, 3}}) /\ (Cardinality(SUBSET {1}) = [TRUE EXCEPT !.a = 2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06473 failed.
    Attempted to select field "a" from a non-record value FALSE
    line 14, col 35 to line 14, col 55 of module random_06473
---*)
