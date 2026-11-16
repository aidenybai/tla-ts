(*---
description: Evaluates a random set expression, seed 262, number 2098.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02098 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a .. [a |-> ((-1 \div -1) + (-3)), b |-> (DOMAIN [x \in Nat |-> x + 1] = ({1, 2} \ {x \in 1..3 : x > 1}))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 77 to line 14, col 80 of module random_02098 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 75.
    | Expression starting at line 14, column 74.
    | ExtendableExpr starting at line 14, column 73.
    | Expression starting at line 14, column 73.
    | ExtendableExpr starting at line 14, column 72.
    | Fatal errors while parsing TLA+ spec in file random_02098
    | In module random_02098
    | Could not parse module random_02098 from file random_02098.tla
    | *** Errors: 1
    | In module random_02098
    | Could not parse module random_02098 from file random_02098.tla
    3002:1 Parsing or semantic analysis failed.
---*)
