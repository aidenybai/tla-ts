(*---
description: Evaluates a random int expression, seed 262, number 7063.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07063 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10848 \in {((CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))[(CHOOSE b10849 \in {2, 1, 3} : FALSE)], CASE (7 = 3) -> Len(<<>>) [] OTHER -> (-<<5, 6>>)} : ((({} \cup 1..3) \cap ({1, 2} \ 2..1)) \subseteq {Len(<<1>>), CASE TRUE -> 2147483647 [] OTHER -> [x \in Nat |-> x + 1]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07063 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 38 to line 14, col 77 of module random_07063
---*)
