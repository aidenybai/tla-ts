(*---
description: Evaluates a random int expression, seed 262, number 4840.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04840 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((CHOOSE f \in [{1, 2} -> 2..1] : TRUE))[(-1 % 2147483647)] = ([[a |-> 1] EXCEPT !.a = -1]).a) THEN Cardinality({b7555 \in (2147483647 .. 0) : (TRUE <=> FALSE)}) ELSE LET b7556 == ((3 * FALSE) \div (2 \div 7)) IN (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))[(CHOOSE b7557 \in {x \in 1..3 : x > 1} : TRUE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04840 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 22 to line 14, col 57 of module random_04840
---*)
