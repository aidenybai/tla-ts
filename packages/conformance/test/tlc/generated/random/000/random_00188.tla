(*---
description: Evaluates a random int expression, seed 262, number 188.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00188 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (({7 : b302 \in 2..1} \ (SUBSET {1} \cup 1..3)) \ {Len(<<1>>), Head(<<3, 1, 2>>)}) THEN IF (\E b303 \in (\A b304 \in Nat : FALSE) : (\E b305 \in {2, 1, 3} : FALSE)) THEN LET b306 == Head(<<1, 2>>) IN SelectSeq(<<1, 2>>, LAMBDA e : e > 0) ELSE (-CASE TRUE -> 0 [] OTHER -> -1) ELSE (([b307 \in {1, 2} |-> [a |-> 1, b |-> TRUE]] @@ [(1 :> 2) EXCEPT ![1] = 0]))[Cardinality(DOMAIN [x \in Nat |-> x + 1])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00188 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as the condition of an IF.
    line 14, col 16 to line 14, col 419 of module random_00188
---*)
