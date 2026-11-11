(*---
description: Evaluates a random bool expression, seed 262, number 8408.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08408 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(<<((1 :> 2))[2147483647], (-1 * 0)>>) = (((7 \div -1) :> (0 + 2)) @@ [b13016 \in DOMAIN SUBSET {1} |-> CASE TRUE -> 2 [] OTHER -> b13016])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 67 to line 14, col 70 of module random_08408 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 65.
    | ExtendableExpr starting at line 14, column 64.
    | Expression starting at line 14, column 64.
    | ExtendableExpr starting at line 14, column 63.
    | Fatal errors while parsing TLA+ spec in file random_08408
    | In module random_08408
    | Could not parse module random_08408 from file random_08408.tla
    | *** Errors: 1
    | In module random_08408
    | Could not parse module random_08408 from file random_08408.tla
    3002:1 Parsing or semantic analysis failed.
---*)
