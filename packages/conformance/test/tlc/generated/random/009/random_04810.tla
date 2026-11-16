(*---
description: Evaluates a random seq expression, seed 262, number 4810.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04810 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append([Append(<<1>>, -1) EXCEPT ![1] = Cardinality(1..3)], (Head(<<3, 1, 2>>) - LET b7501 == 7 IN b7501)), (CASE (-1 = -1) -> (CHOOSE b7502 \in {} : TRUE) [] OTHER -> CASE FALSE -> 7 [] OTHER -> -1 - Cardinality(({1, 2} \cup SUBSET {1}))), (-(IF FALSE THEN -1 ELSE -1 * Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04810 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 151 to line 14, col 176 of module random_04810
---*)
