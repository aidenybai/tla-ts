(*---
description: Evaluates a random bool expression, seed 262, number 3401.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03401 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 * -1) = LET b5399 == 3 IN [a |-> 1]) \/ ((-1 = 3) => ({x \in 1..3 : x > 1} = {}))) /\ ((UNION {{x \in 1..3 : x > 1}, {1}} \ DOMAIN (1 :> 2)) \cup (UNION {2..1, 2..1} \cap {b5400 \in Nat : TRUE}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 23 to line 14, col 23 of module random_03401 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 21.
    | Expression starting at line 14, column 20.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_03401
    | In module random_03401
    | Could not parse module random_03401 from file random_03401.tla
    | *** Errors: 1
    | In module random_03401
    | Could not parse module random_03401 from file random_03401.tla
    3002:1 Parsing or semantic analysis failed.
---*)
