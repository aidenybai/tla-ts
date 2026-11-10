(*---
description: Evaluates a random record expression, seed 262, number 895.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00895 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b1445 \in (DOMAIN [x \in Nat |-> x + 1] \ DOMAIN (1 :> 2)) : ([a |-> b1445, b |-> FALSE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b1445])), b |-> SelectSeq(SubSeq(Append(<<3, 1, 2>>, -1), Head(<<1>>), (1 + 3)), LAMBDA e : e > 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00895 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
