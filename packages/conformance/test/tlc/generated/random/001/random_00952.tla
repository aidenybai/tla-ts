(*---
description: Evaluates a random int expression, seed 262, number 952.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00952 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b1531 \in (DOMAIN [x \in Nat |-> x + 1] \cup UNION {{}, {2, 1, 3}}) : (\A b1532 \in (b1531 .. b1531) : (b1532 = 7))) THEN Head((<<2147483647, 2>> \o <<2, 2147483647>>)) ELSE ((([a |-> 1]).a :> ([x \in Nat |-> x + 1] * 2147483647)))[((7 * 2147483647) + (0 % 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00952 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    Nat
    are not both enumerable
---*)
