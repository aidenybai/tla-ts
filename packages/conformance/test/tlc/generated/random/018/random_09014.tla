(*---
description: Evaluates a random set expression, seed 262, number 9014.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09014 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b14001 \in (SUBSET {1} \cap {x \in 1..3 : x > 1}) : (\A b14002 \in {} : TRUE)}, SubSeq(Append(<<>>, -1), (0 % 2), (2147483647 * 0))} \cap ([[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + (CHOOSE b14003 \in {} : FALSE)] \cap DOMAIN [[x \in 1..2 |-> x] EXCEPT ![0] = 2147483647])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09014 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
