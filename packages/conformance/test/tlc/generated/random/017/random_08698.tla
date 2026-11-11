(*---
description: Evaluates a random set expression, seed 262, number 8698.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08698 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b13462 \in (({2, 1, 3} \cap {}) \cap (1..3 \cup {})) |-> IF (b13462 \in Nat) THEN Head([x \in 1..2 |-> x]) ELSE (0 \div -1)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 139 to line 14, col 142 of module random_08698 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 137.
    | Expression starting at line 14, column 137.
    | ExtendableExpr starting at line 14, column 136.
    | Expression starting at line 14, column 136.
    | IF THEN ELSE starting at line 14, column 81.
    | Fatal errors while parsing TLA+ spec in file random_08698
    | In module random_08698
    | Could not parse module random_08698 from file random_08698.tla
    | *** Errors: 1
    | In module random_08698
    | Could not parse module random_08698 from file random_08698.tla
    3002:1 Parsing or semantic analysis failed.
---*)
