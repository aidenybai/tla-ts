(*---
description: Evaluates a random record expression, seed 262, number 4537.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04537 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b7120 \in {b7121 \in DOMAIN [x \in 1..2 |-> x] : (7 = b7121)} : (({} = Nat) => (2 \div <<1, 2>>))), b |-> (((2..1 \cup 2..1) = UNION {2..1, {}}) \/ {Len(<<3, 1, 2>>), IF TRUE THEN 2 ELSE 3})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04537 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 127 of module random_04537
---*)
