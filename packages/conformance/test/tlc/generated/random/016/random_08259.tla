(*---
description: Evaluates a random set expression, seed 262, number 8259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(IF (3 = 2) THEN (2147483647 \div 0) ELSE Head(<<1, 2>>) % (CHOOSE b12787 \in {0 : b12788 \in 1..3} : (FALSE = (1 :> 2)))), LET b12789 == IF (FALSE <=> TRUE) THEN ([x \in Nat |-> x + 1])[2147483647] ELSE (CHOOSE b12790 \in {} : FALSE) IN ({b12789, b12789} \div Head(<<1, 2>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08259 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    <<2>>
---*)
