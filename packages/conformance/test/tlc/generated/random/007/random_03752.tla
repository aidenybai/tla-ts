(*---
description: Evaluates a random int expression, seed 262, number 3752.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03752 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(1 :> 0) EXCEPT ![(-1 \div -1)] = Head(<<3, 1, 2>>)] EXCEPT ![([b5918 \in {2, 1, 3} |-> 2147483647])[(-1 - 7)]] = ([[x \in 1..2 |-> x] EXCEPT ![7] = 3])[[[a |-> 1] EXCEPT !.a = [a |-> 1]]]])[(([[x \in Nat |-> x + 1] EXCEPT ![[a |-> 1, b |-> TRUE]] = 0] @@ (CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE)))[((TRUE => FALSE) * (-1 * -1))]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 41 to line 14, col 44 of module random_03752 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 39.
    | Expression starting at line 14, column 38.
    | ExtendableExpr starting at line 14, column 37.
    | Expression starting at line 14, column 37.
    | Except Component starting at line 14, column 36.
    | Fatal errors while parsing TLA+ spec in file random_03752
    | In module random_03752
    | Could not parse module random_03752 from file random_03752.tla
    | *** Errors: 1
    | In module random_03752
    | Could not parse module random_03752 from file random_03752.tla
    3002:1 Parsing or semantic analysis failed.
---*)
