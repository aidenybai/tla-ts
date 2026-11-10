(*---
description: Evaluates a random function expression, seed 262, number 7001.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07001 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((2147483647 \div 2) \in (SUBSET {1} \cup {x \in 1..3 : x > 1})) THEN (\E b10728 \in ((1 :> 2) \ {}) : (2..1 < b10728)) ELSE (CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE) :> (([2 EXCEPT ![3] = 1])[Head(<<1>>)] + (([x \in Nat |-> x + 1])[0] \div (CHOOSE b10729 \in {} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07001 failed.
    Attempted to check if the non-enumerable value
    1073741823
    is element of
    {{}, {1}}
---*)
