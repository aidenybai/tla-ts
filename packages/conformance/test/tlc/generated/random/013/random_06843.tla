(*---
description: Evaluates a random int expression, seed 262, number 6843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b10485 \in {b10486 \in ({1, 2} \cup [a |-> 1, b |-> TRUE]) : (1..3 \subseteq {x \in 1..3 : x > 1})} : (({1, 2} \subseteq {1, 2}) /\ (\E b10487 \in 2..1 : TRUE))) \div (((-1 :> 7) @@ [<<5, 6>> EXCEPT ![-1] = 7]))[((2147483647 * 0) - Head(2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06843 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    [a |-> 1, b |-> TRUE]
    are not both enumerable
---*)
