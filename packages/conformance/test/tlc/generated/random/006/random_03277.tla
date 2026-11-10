(*---
description: Evaluates a random int expression, seed 262, number 3277.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03277 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE DOMAIN (CHOOSE f \in [{} -> {}] : TRUE) -> ([(1 :> 1) EXCEPT ![(0 - 2)] = Cardinality({2, 1, 3})])[CASE (FALSE \subseteq 1..3) -> (0 - 3) [] OTHER -> LET b5213 == {1} IN b5213] [] OTHER -> (-(CHOOSE b5214 \in {0, 2} : SubSeq(<<1>>, b5214, b5214))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03277 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a condition of a CASE. line 14, col 21 to line 14, col 59 of module random_03277
---*)
