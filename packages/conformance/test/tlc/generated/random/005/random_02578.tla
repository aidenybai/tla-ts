(*---
description: Evaluates a random function expression, seed 262, number 2578.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02578 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE) EXCEPT ![(Cardinality({b4058 \in 2..1 : TRUE}) + (CHOOSE b4059 \in {b4060 \in {1, 2} : Nat} : (\E b4061 \in b4059 : FALSE)))] = Cardinality(UNION {({2, 1, 3} \cap Nat), UNION {{}, [a |-> 1, b |-> TRUE]}})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02578 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a special set constant.
    line 14, col 160 to line 14, col 162 of module random_02578
---*)
