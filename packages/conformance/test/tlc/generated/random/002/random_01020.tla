(*---
description: Evaluates a random function expression, seed 262, number 1020.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01020 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1644 \in DOMAIN (IF TRUE THEN -1 ELSE 0 :> ({2, 1, 3} * 2)) |-> CASE (\A b1645 \in {2147483647 : b1646 \in {x \in 1..3 : x > 1}} : (b1645 < b1644)) -> ((b1644 + 2147483647) % ([x \in Nat |-> x + 1])[3]) [] OTHER -> LET b1647 == ([x \in Nat |-> x + 1])[1] IN (-2147483647)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01020 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 27 to line 14, col 76 of module random_01020
---*)
