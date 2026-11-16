(*---
description: Evaluates a random record expression, seed 262, number 400.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00400 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((1 * -1) - Cardinality({1, 2})) * ((1 :> -1) @@ (3 :> [a |-> 1]))), b |-> (DOMAIN (CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE) \subseteq (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 28 to line 14, col 28 of module random_00400 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 26.
    | Expression starting at line 14, column 26.
    | ExtendableExpr starting at line 14, column 25.
    | Expression starting at line 14, column 25.
    | ExtendableExpr starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_00400
    | In module random_00400
    | Could not parse module random_00400 from file random_00400.tla
    | *** Errors: 1
    | In module random_00400
    | Could not parse module random_00400 from file random_00400.tla
    3002:1 Parsing or semantic analysis failed.
---*)
