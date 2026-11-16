(*---
description: Evaluates a random set expression, seed 262, number 4527.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04527 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(<<5, 6>> - -1) : b7111 \in (Nat \cup {2, 1, 3})}, {([a |-> 1]).a : b7112 \in UNION {Nat, 1..3}}} \cap {(-(1 \div 7)), ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04527 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    Nat
    are not both enumerable
---*)
