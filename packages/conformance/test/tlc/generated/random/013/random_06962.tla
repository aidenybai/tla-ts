(*---
description: Evaluates a random seq expression, seed 262, number 6962.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06962 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE (CASE TRUE -> -1 [] OTHER -> 3 < Head(<<1, 2>>)) -> (CHOOSE b10652 \in {3, FALSE} : DOMAIN (1 :> 2)) [] OTHER -> ([b10653 \in SUBSET {1} |-> b10653])[(-7)], (LET b10654 == (3 * 2147483647) IN (b10654 % b10654) * (CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06962 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 24 to line 14, col 69 of module random_06962
---*)
