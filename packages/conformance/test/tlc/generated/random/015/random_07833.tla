(*---
description: Evaluates a random seq expression, seed 262, number 7833.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07833 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([<<(CHOOSE b12100 \in {x \in 1..3 : x > 1} : TRUE), ([x \in Nat |-> x + 1])[2147483647]>> EXCEPT ![1] = (CHOOSE b12101 \in ({2, 1, 3} \ 1..3) : ({} \subseteq SUBSET {1}))], IF ((CHOOSE r \in [a : 2..1] : TRUE) = [[a |-> 1] EXCEPT !.a = 1]) THEN Head(SortSeq(2, LAMBDA p, q : p < q)) ELSE [([a |-> 1, b |-> TRUE]).a EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07833 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
