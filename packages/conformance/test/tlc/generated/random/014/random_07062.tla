(*---
description: Evaluates a random function expression, seed 262, number 7062.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10843 \in {b10844 \in (({} \ SUBSET {1}) \cup {b10845 : b10845 \in Nat}) : ((<<5, 6>>)[-1] = (2 + b10844))} |-> (((CHOOSE b10846 \in {1, 2} : TRUE) % (b10843 % b10843)) - LET b10847 == (CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE) IN Head(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07062 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 85 to line 14, col 87 of module random_07062
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
