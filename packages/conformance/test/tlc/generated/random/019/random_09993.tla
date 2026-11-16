(*---
description: Evaluates a random set expression, seed 262, number 9993.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09993 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b15533 \in UNION {{1, 2}, Nat} : (FALSE => TRUE)} \cap ({1 : b15534 \in Nat} \cup {b15535 \in {} : TRUE})) \cap UNION {{(-1 - 0), Len(<<1>>)}, DOMAIN ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09993 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 91 to line 14, col 93 of module random_09993
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
