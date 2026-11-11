(*---
description: Evaluates a random seq expression, seed 262, number 6459.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06459 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SortSeq([<<3, 1, 2>> EXCEPT ![1] = 2147483647], LAMBDA p, q : p < q), LAMBDA e : e > 0), ((Cardinality(2..1) :> CASE FALSE -> 3 [] OTHER -> 0))[([[a |-> 1] EXCEPT !.a = 7]).a], IF ((TRUE => TRUE) => (2..1 = [a |-> 1])) THEN LET b9940 == (3 \div 2) IN (b9940 \div 7) ELSE (CHOOSE b9941 \in UNION {{1}, {x \in 1..3 : x > 1}} : CASE FALSE -> b9941 [] OTHER -> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06459 failed.
    Attempted to apply function:
    (0 :> 0)
    to argument 7, which is not in the domain of the function.
---*)
