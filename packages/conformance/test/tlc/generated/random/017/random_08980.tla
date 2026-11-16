(*---
description: Evaluates a random record expression, seed 262, number 8980.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08980 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b13940 \in {b13941 \in (Nat \ SUBSET {1}) : (TRUE /\ <<1>>)} : (IF FALSE THEN 2147483647 ELSE b13940 \in DOMAIN [x \in 1..2 |-> x])), b |-> (Tail(SortSeq(<<1>>, LAMBDA p, q : p < q)) = ((-1 + 2) :> (2 \div 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08980 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
