(*---
description: Evaluates a random function expression, seed 262, number 5765.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05765 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([b8879 \in ({1, 2} \ SUBSET {1}) |-> Len(<<3, 1, 2>>)] @@ ([b8880 \in {x \in 1..3 : x > 1} |-> 2] @@ (1 .. 2147483647))) EXCEPT ![{b8881 \in (DOMAIN [x \in 1..2 |-> x] \ DOMAIN (1 :> 2)) : ((TRUE \subseteq {x \in 1..3 : x > 1}) \/ (~FALSE))}] = (IF (TRUE \/ TRUE) THEN (<<5, 6>>)[7] ELSE (2 % 7) - IF (\A b8882 \in {1, 2} : TRUE) THEN ([x \in 1..2 |-> x])[7] ELSE (2147483647 - 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05765 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
