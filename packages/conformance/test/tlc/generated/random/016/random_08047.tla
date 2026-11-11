(*---
description: Evaluates a random function expression, seed 262, number 8047.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08047 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b12421 \in {{b12423 \in Nat : FALSE} : b12422 \in ({} \cup Nat)} |-> Cardinality(DOMAIN (1 :> 2))] EXCEPT ![LET b12424 == ((CHOOSE b12425 \in {1, 2} : FALSE) + (3 < 7)) IN (CHOOSE r \in [a : {0} \cup {1}] : TRUE)] = (CHOOSE b12426 \in ({0 : b12427 \in {1, 2}} \cap (2147483647 .. -1)) : ((CHOOSE b12428 \in {1} : FALSE) \in ({2, 1, 3} \cup {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08047 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 69 to line 14, col 79 of module random_08047
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
