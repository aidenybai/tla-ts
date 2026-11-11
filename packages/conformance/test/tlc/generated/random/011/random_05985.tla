(*---
description: Evaluates a random int expression, seed 262, number 5985.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05985 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b9223 == IF ((<<5, 6>> /\ FALSE) \/ ({} \in 2..1)) THEN ([a |-> -1, b |-> FALSE] \div ([x \in 1..2 |-> x])[3]) ELSE (-(3 \div 7)) IN ([[[x \in Nat |-> x + 1] EXCEPT ![b9223] = -1] EXCEPT ![Cardinality({1, 2})] = (2 + b9223)])[((2 * -1) + (b9223 * 3))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 250 to line 14, col 250 of module random_05985 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 248.
    | Expression starting at line 14, column 248.
    | ExtendableExpr starting at line 14, column 247.
    | Expression starting at line 14, column 247.
    | ExtendableExpr starting at line 14, column 246.
    | Fatal errors while parsing TLA+ spec in file random_05985
    | In module random_05985
    | Could not parse module random_05985 from file random_05985.tla
    | *** Errors: 1
    | In module random_05985
    | Could not parse module random_05985 from file random_05985.tla
    3002:1 Parsing or semantic analysis failed.
---*)
