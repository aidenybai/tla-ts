(*---
description: Evaluates a random function expression, seed 262, number 2802.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02802 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b4441 \in ({x \in 1..3 : x > 1} \cap TRUE) : (TRUE \/ TRUE)), b |-> (([a |-> 1] = [a |-> 1]) /\ (FALSE <=> TRUE))] EXCEPT !.a = @ + LET b4442 == Head(SortSeq(<<>>, LAMBDA p, q : p < q)) IN CASE (\E b4443 \in <<5, 6>> : TRUE) -> Len(<<1, 2>>) [] OTHER -> (-b4442)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02802 failed.
    Attempted to check if the value:
    2
    is an element of the boolean TRUE
---*)
