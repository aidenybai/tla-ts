(*---
description: Evaluates a random function expression, seed 262, number 2541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b4008 \in {(-b4009) : b4009 \in (2..1 \cup Nat)} |-> (Cardinality(SUBSET {1}) + ([a |-> 1]).a)] EXCEPT ![LET b4010 == (CHOOSE b4011 \in DOMAIN <<5, 6>> : ([a |-> 1] = [a |-> 1])) IN Cardinality((b4010 .. 1))] = (CASE (-1 < 2147483647) -> (2147483647 - 3) [] OTHER -> (2147483647 % 3) + Cardinality(({2, 1, 3} \cup {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02541 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 51 to line 14, col 63 of module random_02541
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
