(*---
description: Evaluates a random seq expression, seed 262, number 9693.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09693 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((UNION {UNION {1..3, {1, 2}}, ({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1})} \cap {LET b15038 == b15037 IN 2147483647 : b15037 \in (0 .. 0)}), (IF (TRUE \/ FALSE) THEN CASE FALSE -> 2147483647 [] OTHER -> -1 ELSE (-1 \div [x \in 1..2 |-> x]) - ([[x \in Nat |-> x + 1] EXCEPT ![2] = 7])[(2 * 2)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
---*)
