(*---
description: Evaluates a random int expression, seed 262, number 6776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10388 \in {((CHOOSE b10390 \in {2, 1, 3} : FALSE) * ([x \in 1..2 |-> x])[b10389]) : b10389 \in {b10391 \in (SUBSET {1} \cap {x \in 1..3 : x > 1}) : (TRUE /\ TRUE)}} : (((<<3, 1, 2>> \o <<>>) = (CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE)) <=> (\E b10392 \in {b10393 \in {} : TRUE} : [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06776 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
