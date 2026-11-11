(*---
description: Evaluates a random record expression, seed 262, number 4448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE))[[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + IF FALSE THEN 1 ELSE 2147483647]], b |-> (SubSeq(Tail(<<>>), CASE TRUE -> 7 [] OTHER -> 2147483647, (CHOOSE b6999 \in 1..3 : <<5, 6>>)) \subseteq DOMAIN [[a |-> 1, b |-> TRUE] EXCEPT ![7] = 0])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04448 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 72 to line 14, col 99 of module random_04448
---*)
