(*---
description: Evaluates a random int expression, seed 262, number 3088.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03088 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4916 == (((-1 % 7) \div (0 * 3)) % [a |-> ([a |-> 1, b |-> TRUE]).a, b |-> ({x \in 1..3 : x > 1} \subseteq 1..3)]) IN CASE (<<0, b4916>> = [b4917 \in {} |-> 3]) -> (Head(<<3, 1, 2>>) * LET b4918 == b4916 IN b4918) [] OTHER -> ((0 * b4916)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
