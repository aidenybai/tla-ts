(*---
description: Evaluates a random int expression, seed 262, number 7475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b11514 \in ((CHOOSE b11515 \in {2, 1, 3} : TRUE) .. IF FALSE THEN 1 ELSE 2) |-> (CASE FALSE -> -1 [] OTHER -> b11514 + Len(<<>>))])[LET b11516 == ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a IN ((CHOOSE r \in [a : 2..1] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07475 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 212 to line 14, col 241 of module random_07475
---*)
