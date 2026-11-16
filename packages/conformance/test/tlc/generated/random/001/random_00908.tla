(*---
description: Evaluates a random int expression, seed 262, number 908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b1462 == (((CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE))[(CHOOSE b1463 \in 2..1 : FALSE)] % (-(2 % -1))) IN LET b1464 == ((2 :> -1))[Head(<<1>>)] IN (CHOOSE b1465 \in DOMAIN [x \in 1..2 |-> x] : ({1, 2} = SUBSET {1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00908 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
