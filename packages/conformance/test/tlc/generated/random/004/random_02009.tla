(*---
description: Evaluates a random function expression, seed 262, number 2009.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02009 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2 % -1) \in (2 .. 2147483647)) @@ (([a |-> 1, b |-> TRUE]).a :> ((1 :> 2)).a)) EXCEPT ![(IF ({x \in 1..3 : x > 1} \subseteq {1}) THEN IF FALSE THEN 3 ELSE -1 ELSE (7 % 0) % (CASE FALSE -> 1 [] OTHER -> 0 \div CASE FALSE -> 2147483647 [] OTHER -> 2))] = IF ([<<1>> EXCEPT ![1] = 0] = (2 :> 2147483647)) THEN ((3 * 2) * (2147483647 % 2)) ELSE ([[x \in Nat |-> x + 1] EXCEPT ![0] = 2])[SelectSeq(<<1, 2>>, LAMBDA e : e > 0)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02009 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
