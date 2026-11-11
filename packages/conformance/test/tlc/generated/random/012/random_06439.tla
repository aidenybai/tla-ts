(*---
description: Evaluates a random bool expression, seed 262, number 6439.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06439 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((1 :> 1..3) .. Head(<<1, 2>>)), UNION {DOMAIN <<5, 6>>, {b9907 \in 1..3 : 3}}} = {((2..1 \cup 1..3) \cup (SUBSET {1} \cap {1, 2})), IF ({2, 1, 3} = {1, 2}) THEN (1 \div -1) ELSE (7 + 3)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 189 to line 14, col 192 of module random_06439 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 187.
    | Expression starting at line 14, column 187.
    | ExtendableExpr starting at line 14, column 186.
    | Expression starting at line 14, column 186.
    | IF THEN ELSE starting at line 14, column 157.
    | Fatal errors while parsing TLA+ spec in file random_06439
    | In module random_06439
    | Could not parse module random_06439 from file random_06439.tla
    | *** Errors: 1
    | In module random_06439
    | Could not parse module random_06439 from file random_06439.tla
    3002:1 Parsing or semantic analysis failed.
---*)
