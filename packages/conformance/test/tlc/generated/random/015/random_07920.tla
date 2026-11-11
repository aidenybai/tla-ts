(*---
description: Evaluates a random set expression, seed 262, number 7920.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07920 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b12225 \in UNION {SUBSET {1}, [x \in 1..2 |-> x]} : (2..1 = {1})) .. CASE (3 \in 2..1) -> (0 \div 2) [] OTHER -> CASE FALSE -> 3 [] OTHER -> 2147483647) \cup UNION {(DOMAIN {} \ ({1, 2} \cup {1})), (({1, 2} \cap 1..3) \cap {b12226 \in {} : <<1, 2>>})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07920 failed.
    Attempted to compare the function <<1, 2>> with the value:
    {{}, {1}}
---*)
