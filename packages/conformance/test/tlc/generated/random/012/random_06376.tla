(*---
description: Evaluates a random record expression, seed 262, number 6376.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06376 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + (CHOOSE b9801 \in {} : FALSE)] EXCEPT !.a = @ + (CHOOSE b9802 \in ({2, 1, 3} \ {x \in 1..3 : x > 1}) : (3 < 7))] EXCEPT !.a = @ + ([[a |-> 7, b |-> TRUE] EXCEPT !.a = @ + (1 \div -1)]).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 245 to line 14, col 248 of module random_06376 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 243.
    | Expression starting at line 14, column 243.
    | ExtendableExpr starting at line 14, column 242.
    | ExtendableExpr starting at line 14, column 238.
    | Expression starting at line 14, column 238.
    | Fatal errors while parsing TLA+ spec in file random_06376
    | In module random_06376
    | Could not parse module random_06376 from file random_06376.tla
    | *** Errors: 1
    | In module random_06376
    | Could not parse module random_06376 from file random_06376.tla
    3002:1 Parsing or semantic analysis failed.
---*)
