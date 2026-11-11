(*---
description: Evaluates a random bool expression, seed 262, number 9780.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09780 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) = (CASE [x \in Nat |-> x + 1] -> -1 [] OTHER -> 7 :> DOMAIN [x \in 1..2 |-> x])) /\ (UNION {(-1 .. 0), {b15185 \in SUBSET {1} : TRUE}} = (CHOOSE r \in [a : {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09780 failed.
    A non-boolean expression (a function of the form  [x \in S |-> expr]) was used as a condition of a CASE. line 14, col 91 to line 14, col 111 of module random_09780
---*)
