(*---
description: Evaluates a random function expression, seed 262, number 7199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11063 \in {CASE (\E b11064 \in {1, 2} : FALSE) -> Head(<<1, 2>>) [] OTHER -> Head(<<3, 1, 2>>), (IF TRUE THEN 2147483647 ELSE 1 % (2147483647 % 0))} |-> IF (({2, 1, 3} \cup {1, 2}) \subseteq (-1 .. b11063)) THEN (CHOOSE f \in [{1} -> 2..1] : TRUE) ELSE Cardinality({0, 3})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07199 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 231 to line 14, col 263 of module random_07199
---*)
