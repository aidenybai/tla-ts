(*---
description: Evaluates a random int expression, seed 262, number 4422.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04422 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (DOMAIN [[x \in 1..2 |-> x] EXCEPT ![7] = -1] = (([a |-> 1, b |-> TRUE]).a .. (1 % 0))) THEN (Len(SelectSeq(<<1>>, LAMBDA e : e > 0)) % (Cardinality(Nat) - (2 \div 2))) ELSE ([(CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) EXCEPT ![(3 % 3)] = Head(<<1, 2>>)])[(CHOOSE b6958 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE <=> FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 28 to line 14, col 45 of module random_04422
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
