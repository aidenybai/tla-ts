(*---
description: Evaluates a random bool expression, seed 262, number 6029.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06029 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b9287 \in DOMAIN [x \in Nat |-> x + 1] : (<<3, 1, 2>> = (1 :> 2))) .. ((CHOOSE f \in [{} -> 2..1] : TRUE))[(2147483647 \div -1)]) = (CHOOSE f \in [{1} -> {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 145 to line 14, col 148 of module random_06029 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 134.
    | Expression starting at line 14, column 134.
    | ExtendableExpr starting at line 14, column 133.
    | Expression starting at line 14, column 133.
    | Some [] Form starting at line 14, column 132.
    | Fatal errors while parsing TLA+ spec in file random_06029
    | In module random_06029
    | Could not parse module random_06029 from file random_06029.tla
    | *** Errors: 1
    | In module random_06029
    | Could not parse module random_06029 from file random_06029.tla
    3002:1 Parsing or semantic analysis failed.
---*)
