(*---
description: Evaluates a random set expression, seed 262, number 4708.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04708 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b7367 \in {(2147483647 \div 1), (-7)} : (({x \in 1..3 : x > 1} \cup <<3, 1, 2>>) \subseteq {3, 3})), [(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (<<SUBSET {1}, 0>> = (1 :> 2147483647))]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04708 failed.
    Attempted to enumerate S \cup T when S:
    {2, 3}
    and T:
    <<3, 1, 2>>
    are not both enumerable
---*)
