(*---
description: Evaluates a random function expression, seed 262, number 90.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00090 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b137 \in (2 \ {x \in 1..3 : x > 1}) : (FALSE <=> TRUE)) :> ((CHOOSE r \in [a : 2..1] : TRUE)).a) @@ [b138 \in {([x \in Nat |-> x + 1] % 2147483647) : b139 \in ((1 :> 2) \ {1})} |-> (CHOOSE b140 \in (Nat \ 1..3) : (TRUE /\ TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00090 failed.
    Attempted to enumerate S \ T when S:
    2
    is not enumerable.
---*)
