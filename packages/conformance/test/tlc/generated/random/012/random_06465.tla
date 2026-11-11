(*---
description: Evaluates a random set expression, seed 262, number 6465.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06465 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((SUBSET {1} \ {x \in 1..3 : x > 1}) \ {b9952 : b9952 \in Nat}) \cup {((1 :> 2) \div 3) : b9953 \in DOMAIN [x \in Nat |-> x + 1]}) \cup ({LET b9955 == 3 IN 2 : b9954 \in UNION {1..3, SUBSET {1}}} \cup DOMAIN [b9956 \in 1..3 |-> b9956])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06465 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 76 to line 14, col 78 of module random_06465
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
