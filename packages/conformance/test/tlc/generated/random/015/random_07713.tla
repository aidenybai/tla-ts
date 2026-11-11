(*---
description: Evaluates a random function expression, seed 262, number 7713.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07713 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((CHOOSE b11894 \in (FALSE \ [a |-> 1, b |-> TRUE]) : (\A b11895 \in {1, 2} : SUBSET {1})) * ([<<5, 6>> EXCEPT ![3] = 0])[([a |-> 1]).a]), (IF (\A b11896 \in {2, 1, 3} : TRUE) THEN (2 .. 3) ELSE [b11897 \in SUBSET {1} |-> 2147483647] % IF (TRUE => FALSE) THEN [b11898 \in SUBSET {1} |-> -1] ELSE IF TRUE THEN FALSE ELSE -1)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07713 failed.
    Attempted to enumerate S \ T when S:
    FALSE
    is not enumerable.
---*)
