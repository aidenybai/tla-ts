(*---
description: Evaluates a random set expression, seed 262, number 4215.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04215 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b6628 \in UNION {2..1, SUBSET {1}} : (TRUE <=> FALSE)) .. (-Head(FALSE))) \cup ([[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = CASE (1 :> 2) -> 7 [] OTHER -> 2147483647] = [(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = LET b6629 == 2147483647 IN SUBSET {1}])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04215 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 78 of module random_04215
---*)
