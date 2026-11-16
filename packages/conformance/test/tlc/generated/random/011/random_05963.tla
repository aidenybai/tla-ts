(*---
description: Evaluates a random record expression, seed 262, number 5963.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05963 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[<<1, 2>> EXCEPT !.a = @ + 1] EXCEPT !.a = @ + (-1 * 2147483647)] EXCEPT !.a = @ + (([a |-> 1, b |-> TRUE] = [a |-> 1]) /\ (TRUE => TRUE))] EXCEPT !.a = CASE (UNION {{x \in 1..3 : x > 1}, <<3, 1, 2>>} = ({} \ {1})) -> ((CHOOSE r \in [a : {1, 2}] : TRUE)).a [] OTHER -> Len(SubSeq(<<1>>, 0, 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05963 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
