(*---
description: Evaluates a random set expression, seed 262, number 5712.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05712 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((3 \div -1) * (3 + 7)), ((CHOOSE r \in [a : {1, 2}] : TRUE)).a} = {b8789 \in ({b8790 : b8790 \in Nat} \cup {b8791 : b8791 \in 1..3}) : ((TRUE => FALSE) \/ (2..1 = {1, 2}))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 22 to line 14, col 25 of module random_05712 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 20.
    | Expression starting at line 14, column 20.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_05712
    | In module random_05712
    | Could not parse module random_05712 from file random_05712.tla
    | *** Errors: 1
    | In module random_05712
    | Could not parse module random_05712 from file random_05712.tla
    3002:1 Parsing or semantic analysis failed.
---*)
