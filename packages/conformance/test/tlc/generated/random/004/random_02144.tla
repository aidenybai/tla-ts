(*---
description: Evaluates a random bool expression, seed 262, number 2144.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02144 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b3388 \in ((IF TRUE THEN 7 ELSE 3 .. (1..3).a) \cap UNION {(SUBSET {1} \ 2..1), UNION {{1, 2}, {2, 1, 3}}}) : (\A b3389 \in {Len(<<1>>), Head(<<1, 2>>)} : (([x \in Nat |-> x + 1])[b3388] < (CHOOSE b3390 \in {1, 2} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02144 failed.
    Attempted to check if the value:
    {}
    is an element of the integer 7
---*)
