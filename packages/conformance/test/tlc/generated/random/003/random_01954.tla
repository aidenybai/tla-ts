(*---
description: Evaluates a random bool expression, seed 262, number 1954.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01954 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((SUBSET {1} \cup {1}) = {-1 : b3077 \in Nat}) \/ ([<<1>> EXCEPT ![1] = 0] = [[x \in Nat |-> x + 1] EXCEPT ![-1] = 2])) => (((2 % 0) \div (TRUE % -1)) = IF {-1 : b3078 \in {x \in 1..3 : x > 1}} THEN [<<1>> EXCEPT ![1] = 3] ELSE Cardinality({}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01954 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 59 to line 14, col 61 of module random_01954
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
