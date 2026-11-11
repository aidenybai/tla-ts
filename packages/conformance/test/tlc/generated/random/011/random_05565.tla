(*---
description: Evaluates a random function expression, seed 262, number 5565.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05565 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b8615 \in {b8616 \in ({x \in 1..3 : x > 1} \cup 2) : (TRUE \/ FALSE)} : (\E b8617 \in (1..3 \ {2, 1, 3}) : (FALSE => FALSE))) :> ((Tail(<<3, 1, 2>>) = [b8618 \in SUBSET {1} |-> 1]) /\ ((2147483647 * 1) = (2 \div 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05565 failed.
    Attempted to enumerate S \cup T when S:
    {2, 3}
    and T:
    2
    are not both enumerable
---*)
