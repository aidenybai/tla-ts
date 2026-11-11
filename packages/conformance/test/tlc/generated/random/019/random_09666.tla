(*---
description: Evaluates a random function expression, seed 262, number 9666.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09666 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ([(CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE) EXCEPT ![CASE [x \in 1..2 |-> x] -> FALSE [] OTHER -> 7] = Head(<<3, 1, 2>>)] = IF ([a |-> 1] = [a |-> 1]) THEN Head(<<1, 2>>) ELSE (1 * 2147483647)) THEN ([[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = (2 % 3)]).a ELSE ([((1 :> 2) @@ [x \in Nat |-> x + 1]) EXCEPT ![(-1)] = (2 + [a |-> 1, b |-> TRUE])])[Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09666 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as a condition of a CASE. line 14, col 78 to line 14, col 95 of module random_09666
---*)
