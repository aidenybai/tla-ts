(*---
description: Evaluates a random seq expression, seed 262, number 2044.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02044 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(((CHOOSE b3246 \in {1 : b3247 \in {1}} : (1 < b3246)) \o Tail(Append(<<1, 2>>, -1))), IF ([b3248 \in Nat |-> 2])[(1 \div 1)] THEN Cardinality((2..1 \cap Nat)) ELSE LET b3249 == (-0) IN ([x \in 1..2 |-> x] * {x \in 1..3 : x > 1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02044 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 74 of module random_02044
---*)
