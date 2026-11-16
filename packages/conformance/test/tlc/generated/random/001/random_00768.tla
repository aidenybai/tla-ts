(*---
description: Evaluates a random int expression, seed 262, number 768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ({(2147483647 + -1), (2147483647 - 1)} = {b1259 \in (3 .. 7) : ({} = SUBSET {1})}) THEN (IF Tail(<<>>) THEN ([x \in Nat |-> x + 1])[2147483647] ELSE (1 + -1) \div CASE (1 = 2147483647) -> Cardinality(1..3) [] OTHER -> Len(<<1, 2>>)) ELSE (CHOOSE b1260 \in (([a |-> 1] \ 2..1) \cup {1, 1}) : ((~TRUE) \/ ({2, 1, 3} /\ FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00768 failed.
    Attempted to enumerate S \ T when S:
    [a |-> 1]
    is not enumerable.
---*)
