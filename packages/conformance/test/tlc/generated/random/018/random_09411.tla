(*---
description: Evaluates a random record expression, seed 262, number 9411.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09411 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE]).a % (3 \div -1)) .. (((1 :> 2))[3] \div IF FALSE THEN -1 ELSE 0)) \cup ((CHOOSE b14597 \in ({1, 2} \ {x \in 1..3 : x > 1}) : (\E b14598 \in {2, 1, 3} : TRUE)) .. (CHOOSE b14599 \in DOMAIN [x \in 1..2 |-> x] : (\E b14600 \in {2, 1, 3} : FALSE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 50 to line 14, col 53 of module random_09411 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 48.
    | Expression starting at line 14, column 48.
    | ExtendableExpr starting at line 14, column 47.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Fatal errors while parsing TLA+ spec in file random_09411
    | In module random_09411
    | Could not parse module random_09411 from file random_09411.tla
    | *** Errors: 1
    | In module random_09411
    | Could not parse module random_09411 from file random_09411.tla
    3002:1 Parsing or semantic analysis failed.
---*)
