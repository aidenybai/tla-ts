(*---
description: Evaluates a random function expression, seed 262, number 4900.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04900 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([([x \in 1..2 |-> x] @@ (1 :> 2)) EXCEPT ![[[a |-> 1] EXCEPT !.a = @ + 0]] = (0 \div 7)] @@ (([x \in Nat |-> x + 1])[-1] :> Len(<<1, 2>>))) EXCEPT ![{b7630 \in ((SUBSET {1} \cap {2, 1, 3}) \cup {b7631 \in 1..3 : FALSE}) : (([a |-> 1, b |-> TRUE] < 7) /\ ({x \in 1..3 : x > 1} = 2..1))}] = CASE (Head(<<1>>) \in {b7632 : b7632 \in {}}) -> Len(SelectSeq(<<1>>, LAMBDA e : e > 0)) [] OTHER -> (IF TRUE THEN 2147483647 ELSE 2 + Len(2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04900 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 1]
---*)
