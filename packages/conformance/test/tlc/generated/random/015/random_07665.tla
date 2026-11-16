(*---
description: Evaluates a random function expression, seed 262, number 7665.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07665 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((2147483647 + 2) \in ({} \cup SUBSET {1})) THEN Cardinality((0 .. 1)) ELSE (Len(<<>>) \div (2147483647 % 2)) :> (CHOOSE b11799 \in {(1 \div 2), (7 \div 3)} : (UNION {{1}, {2, 1, 3}} = DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07665 failed.
    2178:0 Overflow when computing 2147483647+2
---*)
