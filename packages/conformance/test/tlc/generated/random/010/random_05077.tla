(*---
description: Evaluates a random seq expression, seed 262, number 5077.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05077 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b7899 \in ({(-1 * 2147483647) : b7900 \in UNION {SUBSET {1}, <<>>}} \cup (DOMAIN [x \in Nat |-> x + 1] \ {2147483647 : b7901 \in <<5, 6>>})) : ((\E b7902 \in ({} \cup {2, 1, 3}) : (b7902 \in {1, 2})) <=> ((-b7899) < (b7899 * 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05077 failed.
    Attempted to compare the function <<>> with the value:
    {{}, {1}}
---*)
