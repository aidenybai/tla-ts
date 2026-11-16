(*---
description: Evaluates a random record expression, seed 262, number 1632.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01632 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{CASE (<<1, 2>> = [x \in Nat |-> x + 1]) -> (b2606 - b2606) [] OTHER -> (b2606 + b2606) : b2606 \in (UNION {1..3, {1, 2}} \cap ({1} \cap {1}))} EXCEPT !.a = @ + [b2607 \in {(7 \div 2), (-7)} |-> ((<<5, 6>> @@ (1 :> 2)))[Head(<<3, 1, 2>>)]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01632 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
