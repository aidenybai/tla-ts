(*---
description: Evaluates a random record expression, seed 262, number 2842.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02842 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = Len(<<1>>)] EXCEPT !.a = CASE ({1, 2} = 1..3) -> (7 % 2) [] OTHER -> (CHOOSE b4508 \in SUBSET {1} : FALSE)] EXCEPT !.a = Cardinality(DOMAIN (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02842 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 145 to line 14, col 179 of module random_02842
---*)
