(*---
description: Evaluates a random record expression, seed 262, number 6464.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06464 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[7 EXCEPT !.a = 1] EXCEPT !.a = (2 + 1)] EXCEPT !.a = ((2147483647 :> 0) @@ [[x \in Nat |-> x + 1] EXCEPT ![3] = 1])] EXCEPT !.a = @ + CASE (\E b9949 \in {1 : b9950 \in 1..3} : ([x \in Nat |-> x + 1] => 3)) -> ((2 \div 2147483647) * (-0)) [] OTHER -> ((-1) * LET b9951 == 2147483647 IN 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06464 failed.
    Attempted to apply EXCEPT construct to the value 7.
---*)
