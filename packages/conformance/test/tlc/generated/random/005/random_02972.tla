(*---
description: Evaluates a random set expression, seed 262, number 2972.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02972 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{([x \in 1..2 |-> x])[b4715] : b4715 \in {b4716 \in 3 : TRUE}}, {b4717 \in DOMAIN [x \in 1..2 |-> x] : (b4717 = {x \in 1..3 : x > 1})}} \cap ((({} \cup {}) \ (SUBSET {1} \ 1..3)) \cap {(CHOOSE b4719 \in {2, 1, 3} : 2..1) : b4718 \in {b4720 : b4720 \in Nat}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02972 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    3
    is not enumerable
---*)
