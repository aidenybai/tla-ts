(*---
description: Evaluates a random int expression, seed 262, number 6261.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06261 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b9646 \in (DOMAIN (<<5, 6>> @@ <<5, 6>>) \cup {b9647 \in (Nat \ SUBSET {1}) : (b9647 = 2)}) : (Append([<<1, 2>> EXCEPT ![1] = FALSE], IF FALSE THEN 0 ELSE 7) = ((-b9646) :> IF TRUE THEN 2147483647 ELSE 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06261 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
