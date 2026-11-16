(*---
description: Evaluates a random int expression, seed 262, number 1427.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01427 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b2276 \in {Len(<<>>) : b2277 \in {1 : b2278 \in <<>>}} : (({2, 1, 3} \cup 2..1) \subseteq DOMAIN (1 :> 2))) * (CHOOSE b2279 \in {b2280 \in {b2281 \in {} : TRUE} : (FALSE => FALSE)} : (\A b2282 \in (Nat \cup {1}) : (TRUE <=> FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01427 failed.
    TLC encountered a non-enumerable quantifier bound
    <<>>.
    line 14, col 73 to line 14, col 76 of module random_01427
---*)
