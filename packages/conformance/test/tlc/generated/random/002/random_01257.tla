(*---
description: Evaluates a random bool expression, seed 262, number 1257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((UNION {<<1, 2>>, {1, 2}} \ {b2006 \in {} : TRUE}) \cup UNION {UNION {Nat, {1}}, [[a |-> 1] EXCEPT !.a = @ + 2147483647]}) \subseteq ({IF <<3, 1, 2>> THEN b2007 ELSE b2007 : b2007 \in UNION {{}, {}}} \cap (DOMAIN (1 :> 2) \ ({2, 1, 3} \cap Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
