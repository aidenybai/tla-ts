(*---
description: Evaluates a random int expression, seed 262, number 8105.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08105 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1} -> 2..1] : TRUE) EXCEPT ![((CHOOSE b12528 \in DOMAIN [x \in Nat |-> x + 1] : (-1 < b12528)) * SelectSeq(Tail(FALSE), LAMBDA e : e > 0))] = (CASE IF TRUE THEN 1 ELSE 2 -> (0 * 3) [] OTHER -> (0 - 2147483647) \div (Len(<<1, 2>>) \div [[x \in Nat |-> x + 1] EXCEPT ![1] = 7]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08105 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 50 of module random_08105
---*)
