(*---
description: Evaluates a random int expression, seed 262, number 2337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (FALSE /\ TRUE) THEN (2147483647 \div 2) ELSE (CHOOSE b3704 \in {x \in 1..3 : x > 1} : FALSE) :> (CHOOSE b3705 \in SubSeq(<<>>, [x \in Nat |-> x + 1], 3) : (SUBSET {1} \subseteq SUBSET {1}))))[CASE (~([a |-> 1] \subseteq {1, 2})) -> LET b3706 == CASE FALSE -> 2147483647 [] OTHER -> 3 IN (b3706 + b3706) [] OTHER -> Len(Tail(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02337 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 68 to line 14, col 112 of module random_02337
---*)
