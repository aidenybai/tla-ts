(*---
description: Evaluates a random int expression, seed 262, number 9823.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09823 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([b15250 \in UNION {{1, 2}, {}} |-> (b15250 % 2)])[IF SubSeq(<<>>, 2147483647, -1) THEN ([x \in Nat |-> x + 1])[2147483647] ELSE ([a |-> 1, b |-> TRUE]).a], (((-7) \div Cardinality(Nat)) - IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (-3) ELSE (CHOOSE b15251 \in 2..1 : FALSE))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09823 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 69 to line 14, col 171 of module random_09823
---*)
