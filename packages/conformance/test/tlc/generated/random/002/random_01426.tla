(*---
description: Evaluates a random int expression, seed 262, number 1426.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01426 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((-3) \div (7 % 7)) = Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))) THEN ((CHOOSE b2272 \in UNION {{2, 1, 3}, 2..1} : (\E b2273 \in {1, 2} : FALSE)) * (CHOOSE b2274 \in (7 < 0) : (3 = b2274))) ELSE LET b2275 == ((3 :> 2))[(2 \div 2)] IN (Cardinality({1}) * (-1 % 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
