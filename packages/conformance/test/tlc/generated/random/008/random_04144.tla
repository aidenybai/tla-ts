(*---
description: Evaluates a random seq expression, seed 262, number 4144.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04144 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(<<(Cardinality(1..3) * (0 - 0)), CASE (TRUE <=> FALSE) -> (2147483647 % 0) [] OTHER -> (2147483647 + -1)>>, LET b6529 == ((2147483647 + 7) + Cardinality({1})) IN ((b6529 :> 7) % LET b6530 == 7 IN b6529), (((2 - 2) * (3 + 7)) - ((1 \div 2147483647) + Cardinality(Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+7
    2178:0 Overflow when computing 2147483647+7
---*)
