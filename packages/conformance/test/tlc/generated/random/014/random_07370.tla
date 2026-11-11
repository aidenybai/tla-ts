(*---
description: Evaluates a random int expression, seed 262, number 7370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF {[Append(<<>>, b11341) EXCEPT ![1] = LET b11342 == 2 IN 3] : b11341 \in (Cardinality({1, 2}) .. Head(<<1>>))} THEN (CHOOSE b11343 \in DOMAIN [(1 :> 2) EXCEPT ![0] = 7] : ({3, 2147483647} = (Nat \ {1}))) ELSE [[[(1 :> 2) EXCEPT !.a = -1] EXCEPT !.a = ([a |-> 1]).a] EXCEPT !.a = @ + (CHOOSE b11344 \in UNION {{1, 2}, SUBSET {1}} : ({2, 1, 3} = [a |-> 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07370 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as the condition of an IF.
    line 14, col 16 to line 14, col 373 of module random_07370
---*)
