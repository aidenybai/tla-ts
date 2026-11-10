(*---
description: Evaluates a random record expression, seed 262, number 7460.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07460 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[(1 :> 2) EXCEPT ![1] = 2] EXCEPT ![(-2147483647)] = LET b11499 == <<>> IN 1])[(([a |-> 1, b |-> TRUE]).a - ([a |-> 1, b |-> TRUE]).a)] :> CASE (([a |-> 1]).a < (0 \div 3)) -> Head([<<1>> EXCEPT ![1] = -1]) [] OTHER -> ((-0) \div (-1 * -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 253 to line 14, col 253 of module random_07460 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 251.
    | Expression starting at line 14, column 250.
    | ExtendableExpr starting at line 14, column 249.
    | ExtendableExpr starting at line 14, column 239.
    | Expression starting at line 14, column 239.
    | Fatal errors while parsing TLA+ spec in file random_07460
    | In module random_07460
    | Could not parse module random_07460 from file random_07460.tla
    | *** Errors: 1
    | In module random_07460
    | Could not parse module random_07460 from file random_07460.tla
    3002:1 Parsing or semantic analysis failed.
---*)
