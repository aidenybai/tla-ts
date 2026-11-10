(*---
description: Evaluates a random function expression, seed 262, number 9457.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09457 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14682 \in ({CASE FALSE -> b14683 [] OTHER -> 2 : b14683 \in UNION {{2, 1, 3}, {1}}} \cup DOMAIN [b14684 \in 1..3 |-> -1]) |-> ([b14685 \in (SUBSET {1} \ {2, 1, 3}) |-> (b14685 % b14682)] @@ [b14686 \in {b14687 : b14687 \in Nat} |-> (0 + b14686)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09457 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 241 to line 14, col 243 of module random_09457
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
