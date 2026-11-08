(*---
description: Evaluates a random bool expression, seed 262, number 9933.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09933 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [[<<1>> EXCEPT ![1] = 7] EXCEPT ![(0 % -1)] = ([x \in Nat |-> x + 1])[-1]] \subseteq {Len(([x \in Nat |-> x + 1] @@ <<5, 6>>)), (CHOOSE b15454 \in ({1, 2} \cup {}) : (TRUE => TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09933 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
