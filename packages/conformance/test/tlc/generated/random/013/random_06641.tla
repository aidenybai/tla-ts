(*---
description: Evaluates a random record expression, seed 262, number 6641.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06641 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((~FALSE) \cup ({x \in 1..3 : x > 1} \cup SUBSET {1})) = {b10190 \in (SUBSET {1} \cap SUBSET {1}) : ({x \in 1..3 : x > 1} = <<5, 6>>)}) -> Len([Tail(<<3, 1, 2>>) EXCEPT ![1] = ((1 :> 2))[2147483647]]) [] OTHER -> IF [a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (TRUE \/ 0)] THEN (Head(<<3, 1, 2>>) \div (7 + 2147483647)) ELSE ((7 + -1) \div LET b10191 == 2 IN -1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06641 failed.
    Attempted to enumerate S \cup T when S:
    TRUE
    and T:
    {2, 3} \cup {{}, {1}}
    are not both enumerable
---*)
