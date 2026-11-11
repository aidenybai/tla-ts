(*---
description: Evaluates a random function expression, seed 262, number 2071.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02071 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1} -> 2..1] : TRUE) EXCEPT ![(CHOOSE b3299 \in {b3300 \in ({x \in 1..3 : x > 1} \cap Nat) : (~[a |-> 1, b |-> TRUE])} : ({2 : b3301 \in [x \in Nat |-> x + 1]} = DOMAIN [x \in 1..2 |-> x]))] = Len(Append(<<1, 7>>, ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02071 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 50 of module random_02071
---*)
