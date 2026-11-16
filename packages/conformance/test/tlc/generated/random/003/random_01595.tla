(*---
description: Evaluates a random record expression, seed 262, number 1595.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01595 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (CHOOSE b2548 \in 2..1 : 2147483647), b |-> (2..1 \subseteq {x \in 1..3 : x > 1})] EXCEPT !.a = @ + (CASE TRUE -> 7 [] OTHER -> 2147483647 * (7 \div 0))] EXCEPT !.a = (CHOOSE b2549 \in (({x \in 1..3 : x > 1} \ <<5, 6>>) \cap DOMAIN (1 :> 2)) : SortSeq(SubSeq(<<1>>, b2549, b2549), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01595 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 59 of module random_01595
---*)
