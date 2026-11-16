(*---
description: Evaluates a random record expression, seed 262, number 3001.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03001 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + ((CHOOSE b4766 \in ({2, 1, 3} \ {x \in 1..3 : x > 1}) : (<<>> = [a |-> 1, b |-> TRUE])) \div CASE (\E b4767 \in 1..3 : TRUE) -> ([x \in Nat |-> x + 1])[2] [] OTHER -> ({2, 1, 3} \ 1..3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03001 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 74 to line 14, col 157 of module random_03001
---*)
